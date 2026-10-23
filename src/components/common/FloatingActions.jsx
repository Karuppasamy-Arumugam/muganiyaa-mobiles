import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, ChevronRight } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { supabase } from '../../services/supabaseClient';

export default function FloatingActions({ currentProduct = null, currentVariant = null }) {
  const { db } = useData();
  const location = useLocation();
  const chatbotSettings = db.chatbotSettings || {};
  const assistantName = chatbotSettings.assistantName?.trim() || 'Muganiyaa Assistant';
  const welcomeMessage = chatbotSettings.welcomeMessage?.trim() ||
    'Namaste! Welcome to Muganiyaa-Mobiles. How can I help you today? You can ask about our latest phones, screen repairs, EMI offers, or shop timings.';
  const defaultStarterQuestions = [
    'Show phones under ₹20,000',
    'Do you repair displays?',
    'What EMI options are available?',
    'How can I contact the shop?'
  ];
  const starterQuestions = Array.isArray(chatbotSettings.starterQuestions)
    ? chatbotSettings.starterQuestions.map((question) => String(question || '').trim()).filter(Boolean)
    : defaultStarterQuestions;
  const chatbotEnabled = chatbotSettings.enabled ?? true;
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [messages, setMessages] = useState(() => [
    { id: 'msg-welcome', sender: 'bot', text: welcomeMessage }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatMessagesEndRef = useRef(null);
  const messageIdCounter = useRef(1);

  const contact = db.contactSettings || {};
  const whatsappNumber = contact.whatsapp?.replace(/[^0-9]/g, '');
  const isAdmin = location.pathname.startsWith('/store-owner-7f3c9a2e6b41d805');

  useEffect(() => {
    if (isChatOpen) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  // Settings may arrive after the widget's first render. Update the greeting
  // only while the customer has not started a conversation.
  useEffect(() => {
    setMessages((current) => {
      if (current.length !== 1 || current[0]?.id !== 'msg-welcome') return current;
      return [{ ...current[0], text: welcomeMessage }];
    });
  }, [welcomeMessage]);

  useEffect(() => {
    if (!chatbotEnabled) setIsChatOpen(false);
  }, [chatbotEnabled]);

  const getWhatsAppMessage = () => {
    if (currentProduct) {
      const variantInfo = currentVariant
        ? ` (${currentVariant.color || ''}, ${currentVariant.ram || ''} ${currentVariant.storage || ''})`
        : '';

      return encodeURIComponent(
        `Hello Muganiyaa-Mobiles! I'm enquiring about ${currentProduct.name}${variantInfo} priced at ₹${(
          currentVariant?.sellingPrice || currentProduct.sellingPrice
        )?.toLocaleString('en-IN')}. Is this in stock?`
      );
    }

    return encodeURIComponent(
      "Hello Muganiyaa-Mobiles! I'd like to enquire about your product availability and store services."
    );
  };

  const handleWhatsAppClick = () => {
    if (whatsappNumber && whatsappNumber.length >= 10) {
      const url = `https://wa.me/${whatsappNumber}?text=${getWhatsAppMessage()}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      setShowWhatsAppModal(true);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isThinking) return;

    const userMsg = {
      id: `msg-${messageIdCounter.current++}`,
      sender: 'user',
      text
    };

    const history = messages
      .filter((item) => item.sender === 'user' || item.sender === 'bot')
      .slice(-8)
      .map((item) => ({
        role: item.sender === 'user' ? 'user' : 'assistant',
        content: item.text
      }));

    const messageForAssistant = currentProduct
      ? `${text}\n\nCurrent product page: ${currentProduct.name}${
          currentVariant
            ? `, colour ${currentVariant.color || ''}, RAM ${currentVariant.ram || ''}, storage ${currentVariant.storage || ''}, price ₹${currentVariant.sellingPrice || currentProduct.sellingPrice || ''}`
            : ''
        }`
      : text;

    setMessages((previous) => [...previous, userMsg]);
    setInputVal('');
    setIsThinking(true);

    try {
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }

      const { data, error } = await supabase.functions.invoke(
        'muganiyaa-assistant',
        {
          body: {
            message: messageForAssistant,
            history
          }
        }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const botMsg = {
        id: `msg-bot-${messageIdCounter.current++}`,
        sender: 'bot',
        text: data?.text || 'Sorry, I could not prepare a reply. Please try again.',
        products: Array.isArray(data?.products) ? data.products : [],
        cta: data?.cta || null,
        contact: data?.contact || null
      };

      setMessages((previous) => [...previous, botMsg]);
    } catch (error) {
      console.error('Assistant request failed:', error);

      setMessages((previous) => [
        ...previous,
        {
          id: `msg-bot-${messageIdCounter.current++}`,
          sender: 'bot',
          text: 'I couldn’t connect to the assistant just now. Please try again in a moment or contact the store.'
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };



  if (isAdmin) return null;

  return (
    <>
      <div className="floating-actions-container" aria-label="Customer support options">
        <button
          type="button"
          className="floating-btn-whatsapp"
          onClick={handleWhatsAppClick}
          aria-label="Enquire on WhatsApp"
          title="Direct WhatsApp Enquiry"
        >
          <MessageCircle size={26} />
        </button>

        {chatbotEnabled && (
          <button
            type="button"
            className="floating-btn-chatbot position-relative"
            onClick={() => setIsChatOpen(!isChatOpen)}
            aria-expanded={isChatOpen}
            aria-label={`Open ${assistantName}`}
            title={assistantName}
          >
            {isChatOpen ? <X size={26} /> : <Bot size={26} />}
            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-success border border-light rounded-circle">
              <span className="visually-hidden">Assistant Online</span>
            </span>
          </button>
        )}
      </div>

      {showWhatsAppModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <MessageCircle size={22} className="text-success" />
                  <span>WhatsApp Enquiry Preview</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowWhatsAppModal(false)}
                />
              </div>
              <div className="modal-body">
                <p className="text-muted small">
                  WhatsApp opens using the number configured in the store contact settings. Here is the pre-composed message:
                </p>
                <div className="p-3 bg-light rounded border text-break font-monospace small">
                  {decodeURIComponent(getWhatsAppMessage())}
                </div>
                <div className="mt-3 p-2 border-start border-warning border-3 bg-warning-subtle small">
                  <strong>Shop Phone:</strong> {contact.phone || 'Not configured'}
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowWhatsAppModal(false)}
                >
                  Close
                </button>
                <Link
                  to="/contact"
                  className="btn btn-brand-primary btn-sm"
                  onClick={() => setShowWhatsAppModal(false)}
                >
                  Use Contact Form Instead
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {chatbotEnabled && isChatOpen && (
        <div className="chatbot-popup" role="dialog" aria-label={`${assistantName} Chat`}>
          <div className="p-3 bg-white border-bottom d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <div
                className="p-2 rounded-circle"
                style={{ backgroundColor: 'var(--soft-blush)', color: 'var(--primary-red)' }}
              >
                <Bot size={20} />
              </div>
              <div>
                <h6 className="mb-0 fw-bold" style={{ fontSize: '0.95rem' }}>
                  {assistantName}
                </h6>
                <small className="text-success d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                  <span
                    className="d-inline-block rounded-circle bg-success"
                    style={{ width: '6px', height: '6px' }}
                  />
                  Gemini AI · Store Catalogue
                </small>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-light btn-sm rounded-circle p-1"
              onClick={() => setIsChatOpen(false)}
              aria-label="Close Assistant"
            >
              <X size={18} />
            </button>
          </div>

          <div
            className="flex-grow-1 overflow-y-auto p-3 d-flex flex-column gap-3"
            style={{ backgroundColor: 'var(--secondary-bg)' }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`d-flex flex-column ${msg.sender === 'user' ? 'align-items-end' : 'align-items-start'}`}
              >
                <div
                  className="p-3 rounded shadow-sm"
                  style={{
                    maxWidth: '86%',
                    fontSize: '0.85rem',
                    lineHeight: '1.5',
                    backgroundColor: msg.sender === 'user' ? 'var(--primary-red)' : '#FFFFFF',
                    color: msg.sender === 'user' ? '#FFFFFF' : 'var(--main-text)',
                    borderRadius:
                      msg.sender === 'user'
                        ? '14px 14px 2px 14px'
                        : '14px 14px 14px 2px',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {msg.text}
                </div>

                {msg.products?.length > 0 && (
                  <div className="mt-2 w-100 d-flex flex-column gap-2" style={{ maxWidth: '95%' }}>
                    {msg.products.map((product) => (
                      <div
                        key={product.id}
                        className="card p-2 border bg-white shadow-sm"
                        style={{ borderColor: 'var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={product.coverImage}
                            alt={product.name}
                            style={{ width: '45px', height: '45px', objectFit: 'contain' }}
                          />
                          <div className="flex-grow-1 min-w-0">
                            <div className="fw-bold text-truncate" style={{ fontSize: '0.8rem' }}>
                              {product.name}
                            </div>
                            <div className="text-danger fw-bold" style={{ fontSize: '0.82rem' }}>
                              ₹{product.sellingPrice?.toLocaleString('en-IN')}
                            </div>
                          </div>
                          <Link
                            to={`/products/${product.slug}`}
                            className="btn btn-brand-soft btn-sm p-1 px-2 text-decoration-none"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => setIsChatOpen(false)}
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {msg.cta && (
                  <div className="mt-2">
                    <Link
                      to={msg.cta.link}
                      className="btn btn-brand-primary btn-sm d-inline-flex align-items-center gap-1"
                      style={{ fontSize: '0.78rem' }}
                      onClick={() => setIsChatOpen(false)}
                    >
                      <span>{msg.cta.label}</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                )}

                {msg.contact && (
                  <div className="mt-2 d-flex flex-wrap gap-2" aria-label="Store contact links">
                    {msg.contact.phone && (
                      <a
                        href={`tel:${String(msg.contact.phone).replace(/[^\d+]/g, '')}`}
                        className="btn btn-outline-danger btn-sm"
                      >
                        Call Store
                      </a>
                    )}
                    {msg.contact.whatsapp &&
                      String(msg.contact.whatsapp).replace(/\D/g, '').length >= 10 && (
                        <a
                          href={`https://wa.me/${String(msg.contact.whatsapp).replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-success btn-sm"
                        >
                          WhatsApp
                        </a>
                      )}
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="d-flex align-items-center gap-2 text-muted small">
                <span className="spinner-grow spinner-grow-sm text-danger" role="status" />
                <span>{assistantName} is checking the store information...</span>
              </div>
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          <div className="px-3 py-2 bg-white border-top border-bottom overflow-x-auto d-flex gap-2 flex-nowrap">
            {starterQuestions.map((question, index) => (
              <button
                key={index}
                type="button"
                className="btn btn-outline-secondary btn-sm rounded-pill text-nowrap"
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}
                onClick={() => handleSendMessage(question)}
              >
                {question}
              </button>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSendMessage();
            }}
            className="p-2 bg-white d-flex gap-2 align-items-center"
          >
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Ask about phones, repairs, EMI..."
              value={inputVal}
              onChange={(event) => setInputVal(event.target.value)}
              style={{ borderRadius: 'var(--radius-sm)' }}
              disabled={isThinking}
            />
            <button
              type="submit"
              className="btn btn-brand-primary btn-sm px-3"
              disabled={!inputVal.trim() || isThinking}
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
