import { fetchApplications } from './applicationService';
import api from './api';

export const MESSAGE_UPDATE_EVENT = 'messages:updated';

export const emitMessagesUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(MESSAGE_UPDATE_EVENT));
  }
};

export const fetchMessagesByApplication = async (applicationId) => {
  const response = await api.get(`/messages/${applicationId}`);
  return response.data;
};

export const sendMessageByApplication = async (applicationId, text) => {
  const response = await api.post(`/messages/${applicationId}`, { text });
  emitMessagesUpdated();
  return response.data;
};

export const markMessagesAsRead = async (applicationId) => {
  const response = await api.patch(`/messages/${applicationId}/read`);
  emitMessagesUpdated();
  return response.data;
};

export const countUnreadMessages = (messages = []) =>
  messages.filter((message) => message.senderRole === 'admin' && !message.isRead).length;

export const buildConversationSummary = (application, messages = []) => {
  const lastMessage = messages[messages.length - 1] || null;

  return {
    ...application,
    messages,
    lastMessage,
    unreadCount: countUnreadMessages(messages),
  };
};

export const fetchApplicantConversations = async () => {
  const applicationsResponse = await fetchApplications();
  const applications = applicationsResponse.data || [];

  const conversations = await Promise.all(
    applications.map(async (application) => {
      const messagesResponse = await fetchMessagesByApplication(application._id);
      return buildConversationSummary(application, messagesResponse.data || []);
    })
  );

  return conversations.sort((left, right) => {
    const leftDate = new Date(left.lastMessage?.createdAt || left.createdAt || 0).getTime();
    const rightDate = new Date(right.lastMessage?.createdAt || right.createdAt || 0).getTime();
    return rightDate - leftDate;
  });
};
