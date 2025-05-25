import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, Settings, LogOut, CreditCard } from "lucide-react";
import "./ProfileDropdown.css";

interface ProfileDropdownProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  onSignOut: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <button className="profile-button" onClick={toggleDropdown}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="profile-avatar" />
        ) : (
          <div className="profile-avatar-placeholder">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <p className="user-name">{user.name}</p>
            <p className="user-email">{user.email}</p>
          </div>

          <div className="dropdown-divider" />

          <Link to="/account" className="dropdown-item" onClick={() => setIsOpen(false)}>
            <User className="dropdown-icon" />
            <span>My Account</span>
          </Link>

          <Link to="/subscription" className="dropdown-item" onClick={() => setIsOpen(false)}>
            <CreditCard className="dropdown-icon" />
            <span>Subscription</span>
          </Link>

          <Link to="/account/settings" className="dropdown-item" onClick={() => setIsOpen(false)}>
            <Settings className="dropdown-icon" />
            <span>Settings</span>
          </Link>

          <div className="dropdown-divider" />

          <button className="dropdown-item sign-out" onClick={onSignOut}>
            <LogOut className="dropdown-icon" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;