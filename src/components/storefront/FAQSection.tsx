import React, { useState, useEffect } from 'react';
import { getFAQs, FAQ } from '../../services/faqService';

const DEFAULT_FAQS: FAQ[] = [
  {
    id: 'default_faq_1',
    question: 'How do I place a direct order via WhatsApp?',
    answer: 'Simply browse our catalog, select your item, colors, and sizes, then click the "WhatsApp Buy" button. This will instantly pre-fill your order details directly into a WhatsApp chat with our store team for fast confirmation.',
    active: true
  },
  {
    id: 'default_faq_2',
    question: 'What payment methods do you accept?',
    answer: 'We support Cash on Delivery (COD), Direct Bank Transfer, UPI, Credit/Debit cards, and online payments via Stripe.',
    active: true
  },
  {
    id: 'default_faq_3',
    question: 'How long does shipping & delivery take?',
    answer: 'Standard domestic delivery takes 2 to 5 business days. Express shipping options are available during checkout.',
    active: true
  },
  {
    id: 'default_faq_4',
    question: 'What is your return & exchange policy?',
    answer: 'We offer a hassle-free 30-day return & exchange policy. Items must be unworn, unwashed, and in original packaging with tags intact.',
    active: true
  },
  {
    id: 'default_faq_5',
    question: 'Are all products authentic and original?',
    answer: 'Yes! All items in our store are 100% authentic, handcrafted from premium materials, and quality-inspected before dispatch.',
    active: true
  }
];

export function FAQSection() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    getFAQs().then(data => {
      const visibleFaqs = data.filter(faq => faq.active).sort((a, b) => (a.order || 0) - (b.order || 0));
      if (visibleFaqs.length > 0) setFaqs(visibleFaqs);
    }).catch(console.error);
  }, []);

  const displayFaqs = faqs.length > 0 ? faqs : DEFAULT_FAQS;

  return (
    <div className="max-w-4xl mx-auto px-4 mt-12 mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">Frequently Asked Questions</h2>
        <p className="text-neutral-500 text-sm md:text-base">Find answers to common questions about our products and services.</p>
      </div>
      <div className="space-y-4">
        {displayFaqs.map((faq, index) => (
          <div key={faq.id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
            <button 
              className="w-full text-left px-6 py-4 flex justify-between items-center bg-white hover:bg-neutral-50 transition-colors"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span className="font-semibold text-neutral-800">{faq.question}</span>
              <span className="material-symbols-outlined text-neutral-400">
                {openIndex === index ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {openIndex === index && (
              <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 text-neutral-600 text-sm leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
