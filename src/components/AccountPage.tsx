import React, { useState } from 'react';
import { 
  Pencil, 
  ChevronRight, 
  Shield, 
  Globe, 
  Volume2, 
  Subtitles, 
  Crown, 
  Bell, 
  Mail, 
  Lock, 
  Smartphone, 
  Wifi, 
  HelpCircle, 
  LogOut, 
  User, 
  Upload,
  Check
} from 'lucide-react';
import { MainTab } from '../types';

interface AccountPageProps {
  userEmail: string;
  setUserEmail: (email: string) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  onOpenAuthModal: () => void;
  onOpenUploader: () => void;
  setCurrentTab: (tab: MainTab) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  userEmail,
  setUserEmail,
  isLoggedIn,
  setIsLoggedIn,
  onOpenAuthModal,
  onOpenUploader,
  setCurrentTab,
}) => {
  const [profilePin, setProfilePin] = useState(false);
  const [closedCaptions, setClosedCaptions] = useState(false);
  const [streamCellular, setStreamCellular] = useState(true);
  const [audioLang, setAudioLang] = useState('English');
  const [subLang, setSubLang] = useState('English');
  const [contentRestriction, setContentRestriction] = useState('A');

  const displayName = isLoggedIn ? (userEmail.split('@')[0] || 'Bratheronlinework') : 'Bratheronlinework';

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      
      {/* Top Header */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2 border-b border-zinc-900">
        <h1 className="text-xl font-extrabold tracking-tight text-white uppercase">Account</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* User Profile Banner Matching Screenshots 1 & 2 */}
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-4">
          <div className="flex items-center gap-4">
            {/* Crunchyroll Avatar Icon with Pencil Badge */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-[#FF640A] flex items-center justify-center p-2 shadow-lg">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center relative overflow-hidden">
                  <div className="absolute -left-2 w-12 h-12 rounded-full bg-[#FF640A]"></div>
                  <div className="absolute right-2 w-4 h-4 rounded-full bg-black"></div>
                </div>
              </div>
              <button 
                onClick={() => alert('Change profile avatar')}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-zinc-800 text-white hover:bg-[#FF640A] hover:text-black transition-colors border border-zinc-900"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>

            {/* Display Name & Status */}
            <div>
              <h2 className="text-lg font-extrabold text-white">{displayName}</h2>
              <p className="text-xs text-zinc-400 mt-0.5">{isLoggedIn ? userEmail : 'bratheronlinework@gmail.com'}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300">
                Free Membership
              </span>
            </div>
          </div>

          {/* Profile Options Rows */}
          <div className="divide-y divide-zinc-900 pt-2 border-t border-zinc-900">
            <button 
              onClick={() => alert('Switch profile')}
              className="w-full py-3 flex items-center justify-between text-xs font-bold text-zinc-200 hover:text-[#FF640A] transition-colors"
            >
              <span>Switch Profile</span>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </button>

            <div className="py-3 flex items-center justify-between text-xs font-bold text-zinc-200">
              <span>Profile Pin</span>
              <button
                onClick={() => setProfilePin(!profilePin)}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${profilePin ? 'bg-[#FF640A]' : 'bg-zinc-800'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${profilePin ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 1: Viewing Preferences */}
        <div className="space-y-1">
          <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider px-1">
            {displayName}'s Viewing Preferences
          </h3>
          <div className="bg-zinc-950 rounded-xl border border-zinc-900 divide-y divide-zinc-900">
            
            <button 
              onClick={() => setContentRestriction(contentRestriction === 'A' ? 'A (18+ Allowed)' : 'A')}
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-zinc-200 hover:text-white"
            >
              <span>Content Restrictions</span>
              <span className="text-zinc-400 flex items-center gap-1 font-mono">
                {contentRestriction} <ChevronRight className="w-4 h-4" />
              </span>
            </button>

            <button 
              onClick={() => setAudioLang(audioLang === 'English' ? 'Japanese' : 'English')}
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-zinc-200 hover:text-white"
            >
              <span>Audio Language</span>
              <span className="text-zinc-400 flex items-center gap-1">
                {audioLang} <ChevronRight className="w-4 h-4" />
              </span>
            </button>

            <button 
              onClick={() => alert('Audio descriptions setting')}
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-zinc-200 hover:text-white"
            >
              <span>Audio Descriptions</span>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </button>

            <button 
              onClick={() => setSubLang(subLang === 'English' ? 'Hindi' : 'English')}
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-zinc-200 hover:text-white"
            >
              <span>Subtitles/CC Language</span>
              <span className="text-zinc-400 flex items-center gap-1">
                {subLang} <ChevronRight className="w-4 h-4" />
              </span>
            </button>

            <div className="p-3.5 flex items-center justify-between text-xs font-semibold text-zinc-200">
              <span>Closed Captions</span>
              <button
                onClick={() => setClosedCaptions(!closedCaptions)}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${closedCaptions ? 'bg-[#FF640A]' : 'bg-zinc-800'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${closedCaptions ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

          </div>
        </div>

        {/* SECTION 2: Membership */}
        <div className="space-y-1">
          <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider px-1">
            Membership
          </h3>
          <div className="bg-zinc-950 rounded-xl border border-zinc-900 divide-y divide-zinc-900">
            
            <button 
              onClick={() => alert('Crunchyroll Premium Upgrade: $7.99/mo with 14-day Free Trial')}
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-zinc-200 hover:text-white"
            >
              <span className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                Subscription
              </span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                Free <ChevronRight className="w-4 h-4 text-zinc-500" />
              </span>
            </button>

            <button 
              onClick={() => alert('Notification settings')}
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-zinc-200 hover:text-white"
            >
              <span>Notifications</span>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </button>

            <button 
              onClick={() => alert('Change email address')}
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-zinc-200 hover:text-white"
            >
              <span>Email</span>
              <span className="text-zinc-400 flex items-center gap-1 truncate max-w-[200px]">
                {userEmail || 'bratheronlinework@gmail.com'} <ChevronRight className="w-4 h-4" />
              </span>
            </button>

            <button 
              onClick={() => alert('Change password')}
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-zinc-200 hover:text-white"
            >
              <span>Password</span>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </button>

            <button 
              onClick={() => alert('Add phone number')}
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-zinc-200 hover:text-white"
            >
              <span>Add Phone Number</span>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </button>

          </div>
        </div>

        {/* SECTION 3: App Experience & Creator Studio */}
        <div className="space-y-1">
          <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider px-1">
            App Experience
          </h3>
          <div className="bg-zinc-950 rounded-xl border border-zinc-900 divide-y divide-zinc-900">
            
            <div className="p-3.5 flex items-center justify-between text-xs font-semibold text-zinc-200">
              <span>Stream Using Cellular</span>
              <button
                onClick={() => setStreamCellular(!streamCellular)}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${streamCellular ? 'bg-[#FF640A]' : 'bg-zinc-800'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${streamCellular ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <button 
              onClick={() => alert('Notification settings')}
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-zinc-200 hover:text-white"
            >
              <span>Notification Settings</span>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </button>

            <button 
              onClick={() => alert('Connected apps')}
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-zinc-200 hover:text-white"
            >
              <span>Connected Apps</span>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </button>

            {/* Upload Anime Episode / Creator Studio option */}
            <button 
              onClick={onOpenUploader}
              className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-[#FF640A] hover:bg-zinc-900 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Creator Uploader Studio
              </span>
              <ChevronRight className="w-4 h-4 text-[#FF640A]" />
            </button>

          </div>
        </div>

        {/* SECTION 4: Privacy */}
        <div className="space-y-1">
          <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider px-1">
            Privacy
          </h3>
          <div className="bg-zinc-950 rounded-xl border border-zinc-900 divide-y divide-zinc-900">
            
            <button 
              onClick={() => alert('Privacy choices')}
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-zinc-200 hover:text-white"
            >
              <span>Don't Sell/Share my personal information</span>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </button>

            <button 
              onClick={() => alert('Delete account options')}
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-red-400 hover:text-red-300"
            >
              <span>Delete My Account</span>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </button>

          </div>
        </div>

        {/* SECTION 5: Support */}
        <div className="space-y-1">
          <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider px-1">
            Support
          </h3>
          <div className="bg-zinc-950 rounded-xl border border-zinc-900">
            <button 
              onClick={() => alert('Contacting Crunchyroll Support...')}
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-zinc-200 hover:text-white"
            >
              <span>Need Help?</span>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Log Out / Log In Button */}
        <div className="pt-4">
          {isLoggedIn ? (
            <button
              onClick={() => setIsLoggedIn(false)}
              className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs uppercase tracking-wider border border-zinc-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4 text-[#FF640A]" />
              LOG OUT
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="w-full py-3.5 rounded-full bg-[#FF640A] hover:bg-[#e05300] text-black font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg"
            >
              LOG IN / CREATE ACCOUNT
            </button>
          )}
        </div>

        {/* Footer info matching Screenshot 16 */}
        <div className="pt-8 text-center text-[11px] text-zinc-500 space-y-1">
          <p>Version 3.113.2 (1165)</p>
          <div className="flex items-center justify-center gap-4 text-zinc-400 font-medium">
            <button onClick={() => alert('Terms of Service')} className="hover:underline">Terms of Service</button>
            <span>•</span>
            <button onClick={() => alert('Privacy Policy')} className="hover:underline">Privacy Policy</button>
          </div>
        </div>

      </div>

    </div>
  );
};
