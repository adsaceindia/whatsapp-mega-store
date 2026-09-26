import React from 'react';
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter, Youtube, Navigation } from 'lucide-react';
import { useStoreConfig } from '../../context/StoreConfigContext';

export const LocalStoreSection: React.FC = () => {
  const { storeSettings, generalSettings } = useStoreConfig();

  // If map display toggle is off, return null
  if (generalSettings?.showStoreAddressMap === false) {
    return null;
  }

  const storeName = storeSettings?.storeName || 'Our Boutique Store';
  const address = generalSettings?.storeAddress || '123 Fashion Boulevard, Suite 400';
  const city = generalSettings?.storeCity || 'New York';
  const state = generalSettings?.storeState || 'NY';
  const pincode = generalSettings?.storePincode || '10001';
  const country = generalSettings?.storeCountry || 'United States';
  const phone = generalSettings?.storePhone || generalSettings?.whatsappNumber || '+1 (555) 234-5678';
  const email = generalSettings?.storeEmail || 'support@mystore.com';

  const fullAddress = `${address}, ${city}, ${state} ${pincode}, ${country}`.replace(/,\s*,/g, ',').trim();
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <section className="py-16 bg-stone-50 dark:bg-zinc-900 border-t border-stone-200 dark:border-zinc-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-widest text-[#DD8560] font-semibold">
            Visit Us In Person
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white mt-2">
            Local Store & Experience Center
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-3">
            Come explore our curated collections, try on exclusive pieces, and speak directly with our style advisors.
          </p>
        </div>

        {/* Store Grid: Side Panel + Interactive Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Side Panel: Store Details */}
          <div className="lg:col-span-5 bg-white dark:bg-zinc-800/80 p-6 sm:p-8 rounded-2xl border border-stone-200/80 dark:border-zinc-700/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#DD8560]/10 text-[#DD8560] flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white">
                    {storeName}
                  </h3>
                  <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                    Open Daily • 10:00 AM - 9:00 PM
                  </span>
                </div>
              </div>

              {/* Contact List */}
              <div className="space-y-4 text-sm text-stone-700 dark:text-stone-300 mb-8">
                
                {/* Address */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold block text-stone-900 dark:text-white text-xs uppercase tracking-wider mb-0.5">
                      Address
                    </span>
                    <p className="leading-relaxed">{fullAddress}</p>
                  </div>
                </div>

                {/* Phone / Mobile */}
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-stone-400 shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold block text-stone-900 dark:text-white text-xs uppercase tracking-wider mb-0.5">
                      Phone & WhatsApp
                    </span>
                    <a 
                      href={`tel:${phone.replace(/[^\d+]/g, '')}`} 
                      className="hover:text-[#DD8560] transition-colors"
                    >
                      {phone}
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-stone-400 shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold block text-stone-900 dark:text-white text-xs uppercase tracking-wider mb-0.5">
                      Email
                    </span>
                    <a 
                      href={`mailto:${email}`} 
                      className="hover:text-[#DD8560] transition-colors"
                    >
                      {email}
                    </a>
                  </div>
                </div>

              </div>
            </div>

            {/* Social Media Links & Get Directions Button */}
            <div className="pt-6 border-t border-stone-200 dark:border-zinc-700/80 space-y-4">
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Follow Our Store
                </span>
                <div className="flex items-center gap-2">
                  {generalSettings?.instagramUrl && (
                    <a 
                      href={generalSettings.instagramUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-700 text-stone-700 dark:text-stone-200 flex items-center justify-center hover:bg-[#DD8560] hover:text-white transition-colors"
                      title="Instagram"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {generalSettings?.facebookUrl && (
                    <a 
                      href={generalSettings.facebookUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-700 text-stone-700 dark:text-stone-200 flex items-center justify-center hover:bg-[#DD8560] hover:text-white transition-colors"
                      title="Facebook"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                  {generalSettings?.twitterUrl && (
                    <a 
                      href={generalSettings.twitterUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-700 text-stone-700 dark:text-stone-200 flex items-center justify-center hover:bg-[#DD8560] hover:text-white transition-colors"
                      title="Twitter / X"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {generalSettings?.youtubeUrl && (
                    <a 
                      href={generalSettings.youtubeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-700 text-stone-700 dark:text-stone-200 flex items-center justify-center hover:bg-[#DD8560] hover:text-white transition-colors"
                      title="YouTube"
                    >
                      <Youtube className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 font-medium py-3 px-4 rounded-xl text-sm transition-colors shadow-sm"
              >
                <Navigation className="w-4 h-4" />
                Get Directions on Google Maps
              </a>
            </div>

          </div>

          {/* Map View (Google Maps Embed without API Key) */}
          <div className="lg:col-span-7 bg-stone-200 dark:bg-zinc-800 rounded-2xl overflow-hidden border border-stone-200 dark:border-zinc-700 min-h-[360px] lg:min-h-[460px] shadow-sm relative">
            <iframe
              title={`Google Map - ${storeName}`}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '360px' }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={mapEmbedUrl}
              className="w-full h-full min-h-[360px] lg:min-h-[460px]"
            />
          </div>

        </div>
      </div>
    </section>
  );
};
