import React, { useState, useEffect } from 'react';
import { getFAQs, FAQ } from '../../services/faqService';

export function FAQSection() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    getFAQs().then(data => {
      const visibleFaqs = data.filter(faq => faq.active).sort((a, b) => (a.order || 0) - (b.order || 0));
      setFaqs(visibleFaqs);
    }).catch(console.error);
  }, []);

  if (faqs.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 mt-12 mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">Frequently Asked Questions</h2>
        <p className="text-neutral-500 text-sm md:text-base">Find answers to common questions about our products and services.</p>
      </div>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
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
