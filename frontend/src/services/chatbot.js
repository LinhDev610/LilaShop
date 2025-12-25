import { apiRequest } from './api';
import { API_ROUTES } from './constants';

const chatbotService = {
    /**
     * Gửi message đến chatbot AI
     * @param {string} message - Nội dung tin nhắn
     * @param {string} sessionId - Session ID (optional)
     * @returns {Promise<{reply: string, sessionId: string}>}
     */
    async ask(message, sessionId = null) {
        try {
            const payload = { message };
            if (sessionId) {
                payload.sessionId = sessionId;
            }

            const { ok, data } = await apiRequest(API_ROUTES.chatbot.ask, {
                method: 'POST',
                body: payload,
            });

            if (ok && data.code === 1000) {
                return data.result;
            } else {
                throw new Error(data.message || 'Lỗi khi gọi chatbot AI');
            }
        } catch (error) {
            console.error('[Chatbot Service] ask error:', error);
            throw error;
        }
    }
};

export default chatbotService;
