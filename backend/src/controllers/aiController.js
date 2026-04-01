const axios = require('axios');
const Book = require('../models/Book');

const chatWithAI = async (req, res) => {
  try {
    const { message, history } = req.body;
    console.log('[AI] New request:', message);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[AI] GEMINI_API_KEY is not defined');
      return res.status(500).json({ success: false, message: 'AI Config Error' });
    }

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // 1. Smart Retrieval: Prioritize relevance
    const stopwords = ['sách', 'bạn', 'có', 'gì', 'về', 'cho', 'mình', 'tìm', 'kiếm', 'gợi', 'ý', 'không', 'nhé', 'được', 'là', 'với'];
    const rawKeywords = message.toLowerCase()
      .split(/[\s,.;!?]+/)
      .filter(w => w.length >= 2 && !stopwords.includes(w));
    
    // Expand keywords (e.g., "anh" -> "english")
    if (rawKeywords.includes('anh') || rawKeywords.includes('tiếng')) {
      rawKeywords.push('english');
      rawKeywords.push('ngoại văn');
    }
    const keywords = [...new Set(rawKeywords)];
    console.log('[AI] Final Keywords:', keywords);

    let relatedBooks = [];
    if (keywords.length > 0) {
      const regexSearch = keywords.join('|');
      relatedBooks = await Book.find({
        $or: [
          { title: { $regex: regexSearch, $options: 'i' } },
          { categoryName: { $regex: regexSearch, $options: 'i' } }
        ]
      }).limit(20).select('title author categoryName price isFlashSale');
    }

    // Always fetch some bestsellers/promotions to fill background knowledge
    const promoBooks = await Book.find({
      $or: [{ isBestseller: true }, { isFlashSale: true }],
      _id: { $nin: relatedBooks.map(b => b._id) }
    }).limit(15).select('title author categoryName price isFlashSale');

    const books = [...relatedBooks, ...promoBooks];
    console.log(`[AI] Context: Found ${relatedBooks.length} related books and ${promoBooks.length} promo books.`);

    const bookContext = books.map(b => 
      `- ${b.title} [${b.categoryName}] - ${b.author}: ${b.price?.toLocaleString()}đ ${b.isFlashSale ? '(ĐANG GIẢM GIÁ MẠNH)' : ''}`
    ).join('\n');

    // 2. Build the payload for Gemini REST API
    const systemInstruction = `Bạn là trợ lý ảo thông minh của hiệu sách LDA109 Bookstore. 
Nhiệm vụ: Tư vấn và gợi ý sách cho khách hàng dựa trên danh sách dưới đây.

DANH SÁCH SÁCH HIỆN CÓ:
${bookContext}

NGUYÊN TẮC:
1. Phản hồi bằng tiếng Việt thân thiện, chuyên nghiệp.
2. Nếu khách hỏi về thể loại/sách cụ thể, hãy ĐẶC BIỆT chú ý đến các cuốn đầu danh sách (vì đó là sách liên quan nhất).
3. Đừng bao giờ nói là "không có sách" nếu trong danh sách vẫn còn những cuốn tương tự hoặc sách Bestseller.
4. Ưu tiên quảng bá các cuốn "(ĐANG GIẢM GIÁ MẠNH)".`;

    const chatHistory = (history || []).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [
        ...chatHistory,
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\nKhách: ${message}` }]
        }
      ]
    };

    console.log('[AI] Calling Gemini REST API...');
    const result = await axios.post(url, payload);
    
    const aiResponse = result.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('[AI] Success:', aiResponse?.substring(0, 50) + '...');

    res.json({
      success: true,
      data: aiResponse
    });

  } catch (err) {
    const errorDetail = err.response?.data || err.message;
    console.error('[AI] REST Error:', JSON.stringify(errorDetail));

    // LOG TO FILE FOR DEBUGGING
    const fs = require('fs');
    try {
      fs.appendFileSync('ai_debug.log', `[${new Date().toISOString()}] REST ERROR: ${JSON.stringify(errorDetail)}\n`);
    } catch (e) {}

    res.status(500).json({ 
      success: false, 
      message: 'Hệ thống AI đang quá tải hoặc gặp lỗi kết nối. Bạn thử lại sau nhé!',
      debug: err.response?.data?.error?.message || err.message
    });
  }
};

module.exports = {
  chatWithAI
};
