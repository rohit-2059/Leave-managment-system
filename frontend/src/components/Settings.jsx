import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../services/profileService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCamera,
  faUser,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();

    if (!name.trim() || name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    setProfileLoading(true);
    try {
      const data = { name: name.trim(), designation: designation.trim() };

      // If avatar changed
      if (avatarFile) {
        data.avatar = avatarPreview; // base64
      } else if (avatarPreview === '' && user?.avatar) {
        data.avatar = ''; // removed avatar
      }

      const res = await updateProfile(data);
      if (res.success) {
        updateUser(res.user);
        toast.success('Profile updated successfully');
        setAvatarFile(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* Profile Section */}
      <form onSubmit={handleProfileSave} className="bg-white rounded-lg border border-gray-200 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Profile Information</p>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-20 h-20 rounded-lg border border-gray-200 object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                  <FontAwesomeIcon icon={faUser} className="text-2xl text-gray-400" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              >
                <FontAwesomeIcon icon={faCamera} className="text-white text-lg" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Change Photo
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-sm font-medium text-gray-500 hover:text-red-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-1.5" />
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400">JPG, PNG or GIF. Max 5MB.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              placeholder="Your name"
              maxLength={50}
            />
            <p className="text-xs text-gray-400 mt-1">{name.length}/50 characters</p>
          </div>

          {/* Designation / Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Designation</label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              placeholder="e.g. Software Engineer, UI Designer"
              maxLength={100}
            />
            <p className="text-xs text-gray-400 mt-1">Your job title — visible to managers and admins</p>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={profileLoading}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {profileLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Password Section */}
      <form onSubmit={handlePasswordChange} className="bg-white rounded-lg border border-gray-200 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Change Password</p>
          </div>

          <div className="p-6 space-y-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                placeholder="Enter new password"
              />
              <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
    </div>
  );
};

export default Settings;
