'use client';

import { useState } from 'react';
import { useDareProgram } from '@/hooks/useDareProgram';
import PinataService from '@/lib/pinata';
import toast from 'react-hot-toast';

interface CreateDareModalProps {
  onClose: () => void;
  onDareCreated: () => void;
}

export const CreateDareModal: React.FC<CreateDareModalProps> = ({ onClose, onDareCreated }) => {
  const { createDare } = useDareProgram();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [deadline, setDeadline] = useState('');
  const [customDeadline, setCustomDeadline] = useState('');
  const [showCustomDeadline, setShowCustomDeadline] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleQuickDeadline = (minutes: number) => {
    const deadlineDate = new Date(Date.now() + minutes * 60 * 1000);
    const deadlineString = deadlineDate.toISOString().slice(0, 16);
    setDeadline(deadlineString);
    setShowCustomDeadline(false);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image file
    if (!file.type.startsWith('image/')) {
      toast.error('Logo must be an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit for logo
      toast.error('Logo file size must be less than 5MB');
      return;
    }

    setLogoFile(file);
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image file
    if (!file.type.startsWith('image/')) {
      toast.error('Banner must be an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit for banner
      toast.error('Banner file size must be less than 10MB');
      return;
    }

    setBannerFile(file);
    const url = URL.createObjectURL(file);
    setBannerPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !deadline || !rules) {
      toast.error('All fields including rules are required!');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      // Default logo and banner URLs
      const DEFAULT_LOGO = 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafybeih6nwb4mkrtqg2pucdgutumvn464m6nup5clop5msyfzkmifzeumy';
      const DEFAULT_BANNER = 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafybeih6nwb4mkrtqg2pucdgutumvn464m6nup5clop5msyfzkmifzeumy';
      
      let logoUrl = DEFAULT_LOGO; // Use default logo if none provided
      let bannerUrl = DEFAULT_BANNER; // Use default banner if none provided

      // Upload logo if provided
      if (logoFile) {
        setUploadProgress(25);
        toast.loading('Uploading logo...');
        const logoResult = await PinataService.uploadFile(logoFile);
        logoUrl = logoResult.url;
      }

      // Upload banner if provided
      if (bannerFile) {
        setUploadProgress(50);
        toast.dismiss();
        toast.loading('Uploading banner...');
        const bannerResult = await PinataService.uploadFile(bannerFile);
        bannerUrl = bannerResult.url;
      }

      setUploadProgress(75);
      toast.dismiss();
      toast.loading('Creating dare...');

      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
      const minBetLamports = 0.05 * 1e6; // Fixed minimum bet of 0.05 SOL converted to lamports

      // Combine description and rules
      const fullDescription = rules 
        ? `${description}\n\nRules:\n${rules}`
        : description;

      const success = await createDare({
        title,
        description: fullDescription,
        deadline: deadlineTimestamp,
        minBet: minBetLamports,
        logoUrl,
        bannerUrl,
      });

      if (success) {
        setUploadProgress(100);
        toast.dismiss();
        onDareCreated();
      }
    } catch (error: any) {
      console.error('Error creating dare:', error);
      toast.dismiss();
      toast.error('Failed to create dare');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-anarchist-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="bg-anarchist-black border-2 border-anarchist-red max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-anarchist-black p-6 border-b-2 border-anarchist-red">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-brutal font-bold text-anarchist-red uppercase tracking-wider">CREATE NEW DARE</h2>
            <button
              onClick={onClose}
              className="text-anarchist-red hover:text-anarchist-white hover:bg-anarchist-red border border-anarchist-red w-8 h-8 flex items-center justify-center font-brutal text-xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 bg-anarchist-black">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">
                  DARE TITLE *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-anarchist-red bg-anarchist-black text-anarchist-white font-brutal focus:ring-2 focus:ring-anarchist-red focus:border-anarchist-red"
                  placeholder="e.g., Eat a Carolina Reaper pepper"
                  maxLength={100}
                  required
                />
                <p className="text-xs text-anarchist-offwhite mt-1 font-brutal">{title.length}/100 characters</p>
              </div>

              <div>
                <label className="block text-sm font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">
                  DESCRIPTION *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border-2 border-anarchist-red bg-anarchist-black text-anarchist-white font-brutal focus:ring-2 focus:ring-anarchist-red focus:border-anarchist-red"
                  placeholder="Describe the dare in detail. What needs to be done exactly?"
                  maxLength={500}
                  required
                />
                <p className="text-xs text-anarchist-offwhite mt-1 font-brutal">{description.length}/500 characters</p>
              </div>

              <div>
                <label className="block text-sm font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">
                  RULES & REQUIREMENTS *
                </label>
                <textarea
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border-2 border-anarchist-red bg-anarchist-black text-anarchist-white font-brutal focus:ring-2 focus:ring-anarchist-red focus:border-anarchist-red"
                  placeholder="• Must be recorded in one continuous take&#10;• Must show clear view of the action&#10;• No editing or cuts allowed&#10;• Must include your face for verification"
                  maxLength={500}
                  required
                />
                <p className="text-xs text-anarchist-offwhite mt-1 font-brutal">Required rules to clarify expectations ({rules.length}/500)</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">
                    DEADLINE *
                  </label>
                  
                  {/* Quick Deadline Buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => handleQuickDeadline(5)}
                      className={`px-2 py-1 text-xs font-brutal font-bold border-2 transition-colors ${
                        deadline === new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)
                          ? 'bg-anarchist-red text-anarchist-black border-anarchist-red'
                          : 'bg-anarchist-black text-anarchist-white border-anarchist-red hover:bg-anarchist-charcoal'
                      }`}
                    >
                      5MIN
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDeadline(10)}
                      className={`px-2 py-1 text-xs font-brutal font-bold border-2 transition-colors ${
                        deadline === new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16)
                          ? 'bg-anarchist-red text-anarchist-black border-anarchist-red'
                          : 'bg-anarchist-black text-anarchist-white border-anarchist-red hover:bg-anarchist-charcoal'
                      }`}
                    >
                      10MIN
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDeadline(30)}
                      className={`px-2 py-1 text-xs font-brutal font-bold border-2 transition-colors ${
                        deadline === new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16)
                          ? 'bg-anarchist-red text-anarchist-black border-anarchist-red'
                          : 'bg-anarchist-black text-anarchist-white border-anarchist-red hover:bg-anarchist-charcoal'
                      }`}
                    >
                      30MIN
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDeadline(60)}
                      className={`px-2 py-1 text-xs font-brutal font-bold border-2 transition-colors ${
                        deadline === new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)
                          ? 'bg-anarchist-red text-anarchist-black border-anarchist-red'
                          : 'bg-anarchist-black text-anarchist-white border-anarchist-red hover:bg-anarchist-charcoal'
                      }`}
                    >
                      1HR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDeadline(120)}
                      className={`px-2 py-1 text-xs font-brutal font-bold border-2 transition-colors ${
                        deadline === new Date(Date.now() + 120 * 60 * 1000).toISOString().slice(0, 16)
                          ? 'bg-anarchist-red text-anarchist-black border-anarchist-red'
                          : 'bg-anarchist-black text-anarchist-white border-anarchist-red hover:bg-anarchist-charcoal'
                      }`}
                    >
                      2HR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDeadline(180)}
                      className={`px-2 py-1 text-xs font-brutal font-bold border-2 transition-colors ${
                        deadline === new Date(Date.now() + 180 * 60 * 1000).toISOString().slice(0, 16)
                          ? 'bg-anarchist-red text-anarchist-black border-anarchist-red'
                          : 'bg-anarchist-black text-anarchist-white border-anarchist-red hover:bg-anarchist-charcoal'
                      }`}
                    >
                      3HR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDeadline(1440)}
                      className={`px-2 py-1 text-xs font-brutal font-bold border-2 transition-colors ${
                        deadline === new Date(Date.now() + 1440 * 60 * 1000).toISOString().slice(0, 16)
                          ? 'bg-anarchist-red text-anarchist-black border-anarchist-red'
                          : 'bg-anarchist-black text-anarchist-white border-anarchist-red hover:bg-anarchist-charcoal'
                      }`}
                    >
                      24HR
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomDeadline(!showCustomDeadline)}
                      className={`px-2 py-1 text-xs font-brutal font-bold border-2 transition-colors ${
                        showCustomDeadline
                          ? 'bg-anarchist-red text-anarchist-black border-anarchist-red'
                          : 'bg-anarchist-black text-anarchist-white border-anarchist-red hover:bg-anarchist-charcoal'
                      }`}
                    >
                      CUSTOM
                    </button>
                  </div>

                  {/* Custom Deadline Input */}
                  {showCustomDeadline && (
                    <input
                      type="datetime-local"
                      value={customDeadline}
                      onChange={(e) => {
                        setCustomDeadline(e.target.value);
                        setDeadline(e.target.value);
                      }}
                      className="w-full px-3 py-2 border-2 border-anarchist-red bg-anarchist-black text-anarchist-white font-brutal focus:ring-2 focus:ring-anarchist-red focus:border-anarchist-red"
                      min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                    />
                  )}

                  {/* Display Selected Deadline */}
                  {deadline && (
                    <p className="text-xs text-anarchist-offwhite mt-2 font-brutal">
                      Deadline: {new Date(deadline).toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">
                    MINIMUM BET
                  </label>
                  <div className="w-full px-3 py-2 border-2 border-anarchist-gray bg-anarchist-charcoal text-anarchist-offwhite font-brutal">
                    0.05 SOL (FIXED)
                  </div>
                  <p className="text-xs text-anarchist-offwhite mt-1 font-brutal">All dares have a fixed minimum bet of 0.05 SOL</p>
                </div>
              </div>
            </div>

            {/* Right Column - Media */}
            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">
                  LOGO (OPTIONAL)
                </label>
                <div className="w-32 h-32 border-2 border-dashed border-anarchist-red bg-anarchist-charcoal p-3 text-center hover:border-anarchist-white transition-colors flex items-center justify-center mx-auto">
                  {logoPreview ? (
                    <div className="relative">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="mx-auto h-16 w-16 object-cover border border-anarchist-red"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-anarchist-red text-anarchist-black rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 font-brutal font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-full">
                      <input
                        type="file"
                        id="logo-upload"
                        className="hidden"
                        onChange={handleLogoSelect}
                        accept="image/*"
                      />
                      <label htmlFor="logo-upload" className="cursor-pointer block">
                        <div className="text-anarchist-white">
                          <div className="text-2xl mb-1">
                            <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <p className="text-xs font-brutal font-bold uppercase tracking-wider">UPLOAD</p>
                          <p className="text-xs font-brutal text-anarchist-offwhite">PNG, JPG</p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-xs text-anarchist-offwhite mt-1 font-brutal">Square images work best. Will use default logo if not provided.</p>
              </div>

              {/* Banner Upload */}
              <div>
                <label className="block text-sm font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">
                  BANNER IMAGE (OPTIONAL)
                </label>
                <div className="border-2 border-dashed border-anarchist-red bg-anarchist-charcoal p-4 text-center hover:border-anarchist-white transition-colors">
                  {bannerPreview ? (
                    <div className="relative">
                      <img 
                        src={bannerPreview} 
                        alt="Banner preview" 
                        className="mx-auto h-32 w-full object-cover border border-anarchist-red"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBannerFile(null);
                          setBannerPreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-anarchist-red text-anarchist-black rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 font-brutal font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id="banner-upload"
                        className="hidden"
                        onChange={handleBannerSelect}
                        accept="image/*"
                      />
                      <label htmlFor="banner-upload" className="cursor-pointer">
                        <div className="text-anarchist-white">
                          <div className="text-3xl mb-2">
                            <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm0 2h12v6H4V7z" clipRule="evenodd" />
                              <path d="M7 9a1 1 0 11-2 0 1 1 0 012 0z" />
                              <path fillRule="evenodd" d="M6 11l2-2 3 3 4-4 1 1v2H6v-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <p className="text-sm font-brutal font-bold uppercase tracking-wider">UPLOAD BANNER</p>
                          <p className="text-xs font-brutal text-anarchist-offwhite">PNG, JPG up to 10MB</p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-xs text-anarchist-offwhite mt-1 font-brutal">Landscape orientation (16:9) recommended. Will use default banner if not provided.</p>
              </div>

              {/* Upload Progress */}
              {isLoading && uploadProgress > 0 && (
                <div className="bg-anarchist-charcoal border border-anarchist-red p-4">
                  <div className="flex justify-between text-sm text-anarchist-white mb-2 font-brutal">
                    <span>CREATING DARE...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-anarchist-black border border-anarchist-red h-2">
                    <div 
                      className="bg-anarchist-red h-2 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Guidelines */}
              <div className="bg-anarchist-charcoal border border-anarchist-red p-4">
                <h3 className="font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">HOW IT WORKS:</h3>
                <ul className="text-sm text-anarchist-white space-y-1 font-brutal">
                  <li>• People bet on whether someone will complete your dare</li>
                  <li>• First person to submit valid proof gets 50% of the pool</li>
                  <li>• Winning bettors split the remaining 48%</li>
                  <li>• You get 2% as the dare creator</li>
                  <li>• Bettors can cash out early with 10% penalty</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-6 mt-6 border-t-2 border-anarchist-red">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-anarchist-red text-anarchist-white bg-anarchist-black hover:bg-anarchist-charcoal transition-colors font-brutal font-bold uppercase tracking-wider"
              disabled={isLoading}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isLoading || !title || !description || !deadline || !rules}
              className="flex-1 bg-anarchist-red hover:bg-red-700 disabled:bg-anarchist-charcoal disabled:text-anarchist-offwhite text-anarchist-black py-3 px-4 font-brutal font-bold uppercase tracking-wider border-2 border-anarchist-red transition-colors"
            >
              {isLoading ? 'CREATING DARE...' : 'CREATE DARE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
