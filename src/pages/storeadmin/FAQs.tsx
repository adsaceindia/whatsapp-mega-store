import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown
} from 'lucide-react';
import { 
  getFAQs, 
  addFAQ, 
  deleteFAQ, 
  updateFAQ, 
  FAQ 
} from '../../services/faqService';

export function FAQs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newOrder, setNewOrder] = useState<number>(0);
  const [newActive, setNewActive] = useState(true);

  // Edit fields state
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editOrder, setEditOrder] = useState<number>(0);
  const [editActive, setEditActive] = useState(true);

  const triggerToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg('');
    } else {
      setSuccessMsg(msg);
      setErrorMsg('');
    }
    setTimeout(() => {
      setSuccessMsg('');
      setErrorMsg('');
    }, 4000);
  };

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const data = await getFAQs();
      setFaqs(data);
      // Set new order recommendation to length of list + 1
      setNewOrder(data.length + 1);
    } catch (error) {
      console.error("Error loading FAQs:", error);
      triggerToast("Failed to load FAQs from the database.", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) {
      triggerToast("Please fill in both Question and Answer.", true);
      return;
    }
    setSaving(true);
    try {
      await addFAQ({
        question: newQuestion.trim(),
        answer: newAnswer.trim(),
        order: Number(newOrder) || 0,
        active: newActive
      });
      triggerToast("FAQ added successfully!");
      // Reset form
      setNewQuestion('');
      setNewAnswer('');
      setNewOrder(faqs.length + 2);
      setNewActive(true);
      setShowAddForm(false);
      // Reload list
      await fetchFaqs();
    } catch (error) {
      console.error(error);
      triggerToast("Failed to create FAQ.", true);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (faq: FAQ) => {
    if (!faq.id) return;
    setEditingId(faq.id);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
    setEditOrder(faq.order ?? 0);
    setEditActive(faq.active !== false);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editQuestion.trim() || !editAnswer.trim()) {
      triggerToast("Question and Answer cannot be empty.", true);
      return;
    }
    setSaving(true);
    try {
      await updateFAQ(id, {
        question: editQuestion.trim(),
        answer: editAnswer.trim(),
        order: Number(editOrder) || 0,
        active: editActive
      });
      triggerToast("FAQ updated successfully!");
      setEditingId(null);
      await fetchFaqs();
    } catch (error) {
      console.error(error);
      triggerToast("Failed to update FAQ.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this FAQ? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteFAQ(id);
      triggerToast("FAQ deleted successfully.");
      await fetchFaqs();
    } catch (error) {
      console.error(error);
      triggerToast("Failed to delete FAQ.", true);
    }
  };

  const toggleActiveStatus = async (faq: FAQ) => {
    if (!faq.id) return;
    try {
      const updatedStatus = faq.active === false ? true : false;
      await updateFAQ(faq.id, { active: updatedStatus });
      triggerToast(`FAQ status updated to ${updatedStatus ? 'Visible' : 'Hidden'}.`);
      await fetchFaqs();
    } catch (error) {
      console.error(error);
      triggerToast("Failed to update status.", true);
    }
  };

  const moveOrder = async (faq: FAQ, direction: 'up' | 'down') => {
    if (!faq.id) return;
    const currentIndex = faqs.findIndex(f => f.id === faq.id);
    if (currentIndex === -1) return;
    
    let targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const targetFaq = faqs[targetIndex];
    if (!targetFaq.id) return;

    try {
      const tempOrder = faq.order;
      await updateFAQ(faq.id, { order: targetFaq.order });
      await updateFAQ(targetFaq.id, { order: tempOrder });
      triggerToast("FAQs reordered successfully!");
      await fetchFaqs();
    } catch (error) {
      console.error(error);
      triggerToast("Failed to swap orders.", true);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <HelpCircle className="text-primary w-8 h-8" />
            Storefront FAQ Manager
          </h1>
          <p className="text-gray-500">Create, edit, and arrange customer FAQs to handle common shopping questions directly on the storefront home page.</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (editingId) setEditingId(null);
          }}
          className="btn btn-primary btn-md"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? 'Cancel New' : 'Add New FAQ'}
        </button>
      </div>

      {/* Dynamic Alerts */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 shadow-sm">
          <CheckCircle className="text-emerald-500 w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 shadow-sm">
          <AlertCircle className="text-rose-500 w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Form: Add New FAQ */}
      {showAddForm && (
        <div className="mb-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm animate-fade-in text-left">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-100">
            <Plus size={18} className="text-primary" />
            Create Common Storefront Question
          </h2>
          <form onSubmit={handleAddFaq} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Question</label>
                <input
                  type="text"
                  placeholder="e.g. How does shipping over WhatsApp work?"
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl bg-gray-50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Display Priority Order</label>
                <input
                  type="number"
                  placeholder="1"
                  value={newOrder}
                  onChange={e => setNewOrder(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-xl bg-gray-50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Detailed Answer</label>
              <textarea
                placeholder="Explain the solution clearly in markdown or plain text..."
                value={newAnswer}
                onChange={e => setNewAnswer(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-xl bg-gray-50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:bg-white resize-y"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newActive}
                  onChange={e => setNewActive(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-xs font-bold text-gray-700 uppercase">Make visible immediately on storefront</span>
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary btn-sm"
                >
                  <Save size={14} />
                  {saving ? 'Creating...' : 'Create FAQ'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Main FAQ List Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left">
        {loading ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined animate-spin text-[36px] text-primary">progress_activity</span>
            <p className="text-gray-500 mt-2 font-medium">Retrieving customer questions...</p>
          </div>
        ) : faqs.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <HelpCircle size={48} className="mx-auto text-gray-300 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-gray-800">No Frequently Asked Questions created yet</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-6">Create questions to explain delivery speeds, payments, order returns, and guide WhatsApp buyers seamlessly.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary btn-md"
            >
              Add Your First FAQ
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="bg-gray-50/50 p-4 grid grid-cols-12 text-xs font-extrabold uppercase tracking-widest text-gray-400">
              <div className="col-span-1 text-center">Priority</div>
              <div className="col-span-8 md:col-span-7 pl-4">Question & Answer Detail</div>
              <div className="col-span-3 text-center">Status</div>
              <div className="hidden md:block col-span-1 text-center">Reorder</div>
            </div>

            {faqs.map((faq, index) => {
              const isEditing = editingId === faq.id;
              const isVisible = faq.active !== false;

              return (
                <div key={faq.id} className="p-4 md:p-5 grid grid-cols-12 items-start gap-y-3 hover:bg-gray-50/35 transition-colors">
                  {/* Order Number / Priority column */}
                  <div className="col-span-2 md:col-span-1 text-center pt-1">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editOrder}
                        onChange={e => setEditOrder(Number(e.target.value))}
                        className="w-12 text-center border border-gray-300 rounded px-1.5 py-0.5 text-xs font-bold focus:border-primary outline-none"
                      />
                    ) : (
                      <span className="font-mono font-bold text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{faq.order}</span>
                    )}
                  </div>

                  {/* FAQ Content details */}
                  <div className="col-span-10 md:col-span-7 pl-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Edit Question</label>
                          <input
                            type="text"
                            value={editQuestion}
                            onChange={e => setEditQuestion(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium focus:border-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Edit Answer</label>
                          <textarea
                            value={editAnswer}
                            onChange={e => setEditAnswer(e.target.value)}
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:border-primary outline-none resize-y"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-left pr-4">
                        <h4 className="font-bold text-sm text-gray-900 flex items-start gap-1.5 leading-relaxed">
                          <span className="text-primary font-bold text-xs bg-primary/10 px-1.5 py-0.5 rounded">Q</span>
                          {faq.question}
                        </h4>
                        <p className="text-xs text-gray-500 mt-2 pl-6 whitespace-pre-wrap leading-relaxed font-light">{faq.answer}</p>
                      </div>
                    )}
                  </div>

                  {/* Status & Active Column */}
                  <div className="col-span-7 md:col-span-2 flex flex-col items-center justify-center pt-1">
                    {isEditing ? (
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editActive}
                          onChange={e => setEditActive(e.target.checked)}
                          className="w-3.5 h-3.5 text-primary rounded"
                        />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Visible</span>
                      </label>
                    ) : (
                      <button
                        onClick={() => toggleActiveStatus(faq)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          isVisible 
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title={isVisible ? "Click to hide from store" : "Click to show on store"}
                      >
                        {isVisible ? <Eye size={11} /> : <EyeOff size={11} />}
                        {isVisible ? 'Visible' : 'Hidden'}
                      </button>
                    )}
                  </div>

                  {/* Quick Order controls */}
                  <div className="col-span-5 md:col-span-1 flex items-center justify-center gap-1">
                    <button
                      disabled={index === 0 || isEditing}
                      onClick={() => moveOrder(faq, 'up')}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 disabled:opacity-30 disabled:hover:bg-white transition-colors"
                      title="Move Up"
                    >
                      <MoveUp size={13} />
                    </button>
                    <button
                      disabled={index === faqs.length - 1 || isEditing}
                      onClick={() => moveOrder(faq, 'down')}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 disabled:opacity-30 disabled:hover:bg-white transition-colors"
                      title="Move Down"
                    >
                      <MoveDown size={13} />
                    </button>
                  </div>

                  {/* Actions column (Edit/Delete or Save/Cancel) */}
                  <div className="col-span-12 md:col-span-1 flex items-center justify-end gap-2 pt-2 md:pt-0 border-t border-dashed border-gray-100 md:border-none">
                    {isEditing ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSaveEdit(faq.id!)}
                          disabled={saving}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                          title="Save changes"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                          title="Cancel editing"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1 ml-auto">
                        <button
                          onClick={() => startEdit(faq)}
                          className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-lg transition-colors border border-gray-200"
                          title="Edit FAQ"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteFaq(faq.id!)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 rounded-lg transition-colors border border-rose-100"
                          title="Delete FAQ"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
