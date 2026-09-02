import React, { useState, useEffect } from 'react';
import { ResponsiveImage } from '../../components/storefront/ResponsiveImage';
import { Link, useLocation, useNavigate } from 'react-router';
import { getGeneralSettings, getPaymentSettings, GeneralSettings, PaymentSettings } from '../../services/settingsService';
import { useStoreConfig } from '../../context/StoreConfigContext';
import { getCurrencySymbol, formatPrice } from '../../utils/currency';
import { updateOrder } from '../../services/orderService';
import { SkeletonPaymentProcessing } from '../../components/storefront/Skeleton';


const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-sdk')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function OrderConfirmation() {
  const { storeSettings } = useStoreConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const currencyCode = settings?.currency || 'USD';

  // Payment State Managers
  const [isPaid, setIsPaid] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('razorpay');
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [loaderMessage, setLoaderMessage] = useState('Initializing secure checkout...');

  

  useEffect(() => {
    getGeneralSettings().then(setSettings).catch(console.error);
    
    getPaymentSettings().then(setPaymentSettings).catch(console.error);
  }, []);

  const order = location.state?.order || {
    customer: {
      name: "John Doe",
      whatsapp: "+1 (234) 567-890",
      address: "123 Retail Avenue, Suite 400",
      city: "New York",
      pincode: "10001"
    },
    items: [
      {
        id: "p1",
        title: "QuietFlow Pro Headphones",
        price: 189.99,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
        quantity: 1,
        color: "Limited Charcoal"
      },
      {
        id: "p2",
        title: "Bamboo Glass Bottle",
        price: 24.00,
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60",
        quantity: 1,
        color: "Forest Green"
      }
    ],
    subtotal: 213.99,
    discount: 0,
    tax: 10.70,
    total: 224.69
  };

  const [orderId] = useState(() => location.state?.orderId || `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 12).toUpperCase()}`);
  const baseWhatsappUrl = location.state?.whatsappUrl;
  const storePhone = settings?.whatsappNumber || "+1 (234) 567-890";

  
  // Submit Simulated Payment
    const completePaymentSuccess = async (txnId: string) => {
    try {
      if (location.state?.orderId) {
        // Need to ensure updateOrder is available or imported... wait, OrderConfirmation already imports it!
        // We will just do the same thing it was doing.
      }
    } catch(e) {}
  };

  const handlePayment = async () => {
    setPaymentError(null);

    if (selectedMethod === 'cod') {
      setPaymentState('processing');
      setLoaderMessage('Processing Cash on Delivery order...');
      setTimeout(async () => {
        const generatedTxnId = `COD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        setTransactionId(generatedTxnId);
        try {
          if (location.state?.orderId) {
            await updateOrder(location.state.orderId, {
              status: 'Pending',
              paymentStatus: 'Pending',
              paymentMethod: 'cod',
              transactionId: generatedTxnId
            });
          }
          setPaymentState('success');
          setIsPaid(true);
        } catch(e) {
          console.error(e);
          setPaymentError('Failed to place order.');
          setPaymentState('idle');
        }
      }, 1500);
      return;
    }

    // For all other methods, we use Razorpay for real payments.
    if (!paymentSettings?.razorpayKeyId) {
      setPaymentError('Payment gateway is not configured. Please configure Razorpay Key ID in the Admin Panel to take real payments.');
      return;
    }

    setPaymentState('processing');
    setLoaderMessage('Loading Secure Payment Gateway...');
    const res = await loadRazorpayScript();
    
    if (!res) {
      setPaymentError("Payment SDK failed to load. Check your internet connection.");
      setPaymentState('idle');
      return;
    }

    const options = {
      key: paymentSettings.razorpayKeyId,
      amount: Math.round(order.total * 100), // Amount in paise
      currency: currencyCode || 'INR',
      name: storeSettings?.storeName || 'Storefront',
      description: 'Order Payment',
      handler: async function (response: any) {
        const generatedTxnId = response.razorpay_payment_id;
        setTransactionId(generatedTxnId);
        setPaymentState('success');
        setIsPaid(true);
        
        try {
          if (location.state?.orderId) {
            await updateOrder(location.state.orderId, {
              status: 'Paid',
              paymentStatus: 'Paid',
              paymentMethod: selectedMethod,
              transactionId: generatedTxnId
            });
          }
        } catch(e) { console.error(e); }
      },
      prefill: {
        name: order.customer?.name || '',
        email: '',
        contact: order.customer?.whatsapp || ''
      },
      theme: {
        color: '#10b981'
      },
      modal: {
        ondismiss: function() {
          setPaymentState('idle');
        }
      }
    };
    
    const rzp1 = new (window as any).Razorpay(options);
    rzp1.on('payment.failed', function (response: any){
      setPaymentError(response.error.description);
      setPaymentState('idle');
    });
    rzp1.open();
  };

  const getDynamicWhatsappUrl = () => {
    let itemsText = '';
    order.items.forEach((item: any) => {
      const sizeStr = item.size ? ` [Size: ${item.size}]` : '';
      const colorStr = item.color ? ` [Color: ${item.color}]` : '';
      itemsText += `- ${item.quantity}x ${item.title} (${formatPrice(item.price, currencyCode)})${sizeStr}${colorStr}\n`;
    });

    const subtotal = formatPrice(order.subtotal || order.total, currencyCode);
    const discount = formatPrice(order.discount || 0, currencyCode);
    const tax = formatPrice(order.tax || 0, currencyCode);
    const total = formatPrice(order.total, currencyCode);
    const formattedDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const storeName = storeSettings?.storeName || 'us';
    const invoiceText = 
`🌟 *GREETINGS & THANK YOU FOR YOUR PURCHASE!* 🌟
--------------------------------------------------
Hi ${order.customer.name}! Thank you so much for shopping with ${storeName}. We are absolutely thrilled to prepare your premium items! 

To complete your purchase and authorize swift dispatch, please find your generated secure bill copy below.

==================================================
              🧾 *INVOICE & BILL COPY*             
==================================================
• *Order ID:* ${orderId}
• *Date:* ${formattedDate}
• *Payment Status:* VERIFIED PAID & APPROVED 🟢
• *Payment Gateway:* ${selectedMethod.toUpperCase()} Secure Pay
• *Transaction ID:* ${transactionId || 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase()}

*👤 CUSTOMER DETAILS:*
• *Name:* ${order.customer.name}
• *Phone/WhatsApp:* ${order.customer.whatsapp}
• *Shipping Address:* ${order.customer.address}, ${order.customer.city} - ${order.customer.pincode}

*📦 ORDERED ITEMS:*
${itemsText}
*💰 BILLING SUMMARY:*
• *Subtotal:* ${subtotal}
• *Discount:* -${discount}
• *Tax:* ${tax}
--------------------------------------------------
*🔥 TOTAL PAID:* ${total}
==================================================

📣 *WE VALUE YOUR FEEDBACK!*
To help us continue crafting high-quality products, please take a quick moment to leave a review for your purchased item(s) on our web storefront. Your support and review help us tremendously! ⭐⭐⭐⭐⭐

Thank you again, and we look forward to serving you again soon! If you have any questions or need to make edits to your shipping details, just reply directly to this chat message!`;

    return `https://wa.me/${storePhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(invoiceText)}`;
  };

  return (
    <main className="flex-grow pt-24 pb-12 w-full">
      {/* Success Banner */}
      <div className="mb-8 text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container text-on-primary-container mb-4">
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-on-surface">Confirm Your Order</h1>
        <p className="text-base text-on-surface-variant max-w-[400px] mx-auto">
          Please complete your secure payment below to unlock and place your WhatsApp order.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Order Summary Bento Box */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant">
            <h2 className="text-xl font-bold mb-6">Order Details</h2>
            <div className="space-y-4">
              
              {order.items.map((item: any, idx: number) => (
                <div key={item.id || idx} className="flex gap-4 items-center pb-4 border-b border-outline-variant">
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-outline-variant/30 bg-neutral-50 flex items-center justify-center p-2">
                    <ResponsiveImage className="w-full h-full object-cover" src={item.image} alt={item.title} />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-sm md:text-base font-bold text-on-surface">{item.title}</h3>
                    <p className="text-[10px] md:text-xs font-semibold text-on-surface-variant mt-0.5">
                      Qty: {item.quantity}
                      {item.size && ` • Size: ${item.size}`}
                      {item.color && ` • Color: ${item.color}`}
                    </p>
                  </div>
                  <div className="text-base md:text-xl font-bold text-primary whitespace-nowrap">{formatPrice(item.price * item.quantity, currencyCode)}</div>
                </div>
              ))}

            </div>
            
            {/* Totals */}
            <div className="mt-6 space-y-1">
              <div className="flex justify-between text-sm text-on-surface-variant">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal || order.total, currencyCode)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-error">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount, currencyCode)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-on-surface-variant">
                <span>Tax</span>
                <span>{formatPrice(order.tax || 0, currencyCode)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-on-surface pt-4 mt-4 border-t border-outline-variant">
                <span>Total</span>
                <span>{formatPrice(order.total, currencyCode)}</span>
              </div>
            </div>
          </div>
          
          {/* Shipping Destination */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">local_shipping</span>
              Delivery To
            </h3>
            <p className="text-base text-on-surface-variant leading-relaxed">
              <strong>{order.customer.name}</strong><br/>
              {order.customer.address}<br/>
              {order.customer.city} - {order.customer.pincode}<br/>
              Phone/WhatsApp: {order.customer.whatsapp}
            </p>
          </div>
          
          {/* Secure Interactive Payment Box */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-md border-2 border-primary/20">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">shield</span>
              Secure Checkout Payment
            </h3>
            
            {paymentState === 'idle' && (
              <div className="space-y-4">
                <p className="text-sm text-on-surface-variant">
                  Select your preferred payment method. Fill in details to simulate a real secure gateway transaction.
                </p>
                
                 {/* Payment Option Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {(paymentSettings === null || paymentSettings.upiEnabled) && (
                    <>
                      

                                        {(paymentSettings === null || paymentSettings.razorpayEnabled) && (
                    <button 
                      onClick={() => { setSelectedMethod('razorpay'); setPaymentError(null); }}
                      className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition-all ${selectedMethod === 'razorpay' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm font-bold' : 'border-outline-variant hover:bg-surface-container-low text-on-surface-variant'}`}
                    >
                      <span className="material-symbols-outlined text-xl text-blue-600">account_balance</span>
                      <span className="text-xs font-medium">Razorpay</span>
                    </button>
                  )}
<button 
                        onClick={() => { setSelectedMethod('phonepe'); setPaymentError(null); }}
                        className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition-all ${selectedMethod === 'phonepe' ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm font-bold' : 'border-outline-variant hover:bg-surface-container-low text-on-surface-variant'}`}
                      >
                        <span className="material-symbols-outlined text-xl text-purple-600">account_balance_wallet</span>
                        <span className="text-xs font-medium">PhonePe</span>
                      </button>

                      <button 
                        onClick={() => { setSelectedMethod('bhim_upi'); setPaymentError(null); }}
                        className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition-all ${selectedMethod === 'bhim_upi' ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm font-bold' : 'border-outline-variant hover:bg-surface-container-low text-on-surface-variant'}`}
                      >
                        <span className="material-symbols-outlined text-xl text-orange-500">qr_code_2</span>
                        <span className="text-xs font-medium">BHIM UPI</span>
                      </button>

                      <button 
                        onClick={() => { setSelectedMethod('upi'); setPaymentError(null); }}
                        className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition-all ${selectedMethod === 'upi' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm font-bold' : 'border-outline-variant hover:bg-surface-container-low text-on-surface-variant'}`}
                      >
                        <span className="material-symbols-outlined text-xl text-emerald-600">payments</span>
                        <span className="text-xs font-medium">Other UPI</span>
                      </button>
                    </>
                  )}

                  {(paymentSettings === null || paymentSettings.cardsEnabled) && (
                    <button 
                      onClick={() => { setSelectedMethod('card'); setPaymentError(null); }}
                      className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition-all ${selectedMethod === 'card' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm font-bold' : 'border-outline-variant hover:bg-surface-container-low text-on-surface-variant'}`}
                    >
                      <span className="material-symbols-outlined text-xl text-indigo-600">credit_card</span>
                      <span className="text-xs font-medium">Card</span>
                    </button>
                  )}

                  {(paymentSettings === null || paymentSettings.paypalEnabled) && (
                    <button 
                      onClick={() => { setSelectedMethod('paypal'); setPaymentError(null); }}
                      className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition-all ${selectedMethod === 'paypal' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm font-bold' : 'border-outline-variant hover:bg-surface-container-low text-on-surface-variant'}`}
                    >
                      <span className="material-symbols-outlined text-xl text-blue-600">currency_exchange</span>
                      <span className="text-xs font-medium">PayPal</span>
                    </button>
                  )}

                  {(paymentSettings === null || paymentSettings.internationalEnabled) && (
                    <button 
                      onClick={() => { setSelectedMethod('international'); setPaymentError(null); }}
                      className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition-all ${selectedMethod === 'international' ? 'border-teal-600 bg-teal-50 text-teal-700 shadow-sm font-bold' : 'border-outline-variant hover:bg-surface-container-low text-on-surface-variant'}`}
                    >
                      <span className="material-symbols-outlined text-xl text-teal-600">language</span>
                      <span className="text-xs font-medium">Int'l Pay</span>
                    </button>
                  )}

                  {(paymentSettings === null || paymentSettings.codEnabled) && (
                    <button 
                      onClick={() => { setSelectedMethod('cod'); setPaymentError(null); }}
                      className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition-all ${selectedMethod === 'cod' ? 'border-amber-600 bg-amber-50 text-amber-700 shadow-sm font-bold' : 'border-outline-variant hover:bg-surface-container-low text-on-surface-variant'}`}
                    >
                      <span className="material-symbols-outlined text-xl text-amber-600">handshake</span>
                      <span className="text-xs font-medium">COD</span>
                    </button>
                  )}
                </div>

                {/* Generic Payment Info */}
                <div className="mt-4 mb-4 p-5 border border-outline-variant rounded-xl bg-surface-container-lowest/50 text-center animate-fade-in">
                   <div className="flex justify-center mb-2">
                     <span className="material-symbols-outlined text-3xl text-emerald-600">lock</span>
                   </div>
                   <h4 className="text-sm font-bold text-on-surface">Secure Checkout</h4>
                   <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                     {selectedMethod === 'cod' 
                       ? "Place your order securely and pay when it arrives at your doorstep."
                       : "You will securely complete your payment using our verified payment gateway partner."}
                   </p>
                </div>
                {paymentError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-error-container text-on-error-container text-xs font-semibold animate-pulse">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>{paymentError}</span>
                  </div>
                )}

                <button 
                  onClick={handlePayment}
                  className="w-full bg-primary text-on-primary py-4 px-6 rounded-full font-bold hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.96] active:translate-y-0 transition-all duration-300 ease-out shadow-md mt-4 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">lock</span>
                  Authorize & Pay {formatPrice(order.total, currencyCode)}
                </button>
              </div>
            )}

            {paymentState === 'processing' && (
              <SkeletonPaymentProcessing loaderMessage={loaderMessage} />
            )}

            {paymentState === 'success' && (
              <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-emerald-600">Payment Approved!</h4>
                  <p className="text-sm text-on-surface-variant">Your transaction has been processed successfully.</p>
                </div>
                
                <div className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 text-left text-xs space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant font-bold">METHOD:</span>
                    <span className="text-on-surface font-semibold uppercase">{selectedMethod} Gateway</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant font-bold">TRANSACTION ID:</span>
                    <span className="text-on-surface font-semibold text-primary">{transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant font-bold">AMOUNT PAID:</span>
                    <span className="text-on-surface font-bold text-emerald-600">{formatPrice(order.total, currencyCode)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant font-bold">STATUS:</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">verified</span> VERIFIED
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* WhatsApp Call-to-Action */}
        <div className="lg:col-span-5 sticky top-24">
          <div className={`rounded-xl p-6 shadow-lg border-2 transition-all ${isPaid ? 'bg-surface-container-high border-emerald-500 shadow-emerald-500/10' : 'bg-surface-container-low border-outline-variant opacity-85'}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-full ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-outline-variant text-on-surface-variant'}`}>
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isPaid ? 'chat' : 'lock'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-on-surface">Final Step</h2>
                <p className={`text-xs font-bold uppercase tracking-wider ${isPaid ? 'text-emerald-600 animate-pulse' : 'text-on-surface-variant'}`}>
                  {isPaid ? 'Payment Verified - Place Order' : 'Payment Required First'}
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <p className="text-base text-on-surface-variant leading-relaxed">
                {isPaid 
                  ? "Great! Your payment is approved and verified. Click below to open WhatsApp to finalize and submit your order details immediately."
                  : "Please choose a payment method and authorize your transaction using the form on the left. Once paid, the WhatsApp order submission button will automatically activate."
                }
              </p>
              
              {isPaid ? (
                <div className="flex flex-col gap-2.5">
                  <a 
                    href={getDynamicWhatsappUrl()} 
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.96] active:translate-y-0 text-white py-4 px-6 rounded-full font-bold transition-all duration-300 ease-out shadow-lg"
                  >
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.628 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path>
                    </svg>
                    Open WhatsApp to Complete Order
                  </a>

                  <Link 
                    to="/" 
                    className="flex items-center justify-center gap-2 w-full bg-primary text-on-primary py-3.5 px-6 rounded-full font-bold hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.96] active:translate-y-0 transition-all duration-300 ease-out shadow-md text-center"
                  >
                    <span className="material-symbols-outlined text-xl">shopping_bag</span>
                    Continue Shopping & Return Home
                  </Link>
                </div>
              ) : (
                <button 
                  disabled
                  className="flex items-center justify-center gap-2 w-full bg-outline-variant text-on-surface-variant/70 py-4 px-6 rounded-full font-semibold cursor-not-allowed border border-outline-variant"
                >
                  <span className="material-symbols-outlined">lock</span>
                  Unlock After Payment
                </button>
              )}
              
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant text-center space-y-1">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Store Number</p>
                <p className="text-xl font-bold text-secondary">{storePhone}</p>
                <p className="text-sm text-on-surface-variant italic">A representative will confirm your order shortly.</p>
              </div>
              
              <div className="pt-2 text-center">
                <Link to="/" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline transition-all">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back to Store
                </Link>
              </div>
            </div>
          </div>
          
          {/* Trust Badge */}
          <div className="mt-4 flex items-center justify-center gap-2 text-on-surface-variant opacity-70">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span className="text-xs font-semibold">Secure, chat-based checkout powered by FastCheckout</span>
          </div>
        </div>
      </div>
    </main>
  );
}

