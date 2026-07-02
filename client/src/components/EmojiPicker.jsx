import React, { useState } from 'react';

const EMOJI_CATEGORIES = {
  '😀': {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓']
  },
  '👍': {
    name: 'Hands',
    emojis: ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '✍️', '👋', '👏', '🙌', '👐', '🤲', '🙏', '🤝', '🤝', '🤝', '🤝', '🤝', '🤝']
  },
  '❤️': {
    name: 'Hearts',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💤', '💢', '💣', '💥', '💦', '💨', '💫']
  },
  '🐶': {
    name: 'Animals',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦞', '🦀']
  },
  '🍏': {
    name: 'Foods',
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥗', '🍲', '🫕', '🥣', '🍣', '🍤']
  }
};

const EmojiPicker = ({ onSelectEmoji, onEmojiSelect, onClose }) => {
  const [activeTab, setActiveTab] = useState('😀');

  const handleSelect = (emoji) => {
    if (onSelectEmoji) onSelectEmoji(emoji);
    if (onEmojiSelect) onEmojiSelect(emoji);
  };

  return (
    <div 
      className="glass-panel"
      style={{
        position: 'absolute',
        bottom: '80px',
        right: '24px',
        width: '320px',
        height: '350px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(8, 8, 10, 0.95)',
        border: '1px solid rgba(144, 71, 246, 0.25)',
        boxShadow: '0 10px 30px rgba(144, 71, 246, 0.15), 0 10px 25px rgba(0, 0, 0, 0.5)',
        borderRadius: '16px',
        overflow: 'hidden',
        animation: 'spillMsgFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      {/* Category Tabs */}
      <div 
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '8px 12px 0 12px',
          gap: '8px'
        }}
      >
        {Object.keys(EMOJI_CATEGORIES).map((tabKey) => {
          const isActive = activeTab === tabKey;
          return (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                padding: '6px 8px 10px 8px',
                cursor: 'pointer',
                borderBottom: isActive ? '2px solid #9047f6' : '2px solid transparent',
                opacity: isActive ? 1 : 0.6,
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              title={EMOJI_CATEGORIES[tabKey].name}
            >
              {tabKey}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onClose}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: '#a1a1aa',
            fontSize: '18px',
            padding: '6px 8px 10px 8px',
            cursor: 'pointer',
            opacity: 0.6,
            outline: 'none'
          }}
          title="Close"
        >
          ✕
        </button>
      </div>

      {/* Emoji grid scroll area */}
      <div 
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.1)'
        }}
        className="emoji-picker-scroll"
      >
        {EMOJI_CATEGORIES[activeTab].emojis.map((emoji, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelect(emoji)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              padding: '4px',
              cursor: 'pointer',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(144, 71, 246, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
      
      {/* Scrollbar overrides */}
      <style>{`
        .emoji-picker-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .emoji-picker-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .emoji-picker-scroll::-webkit-scrollbar-thumb {
          background: rgba(144, 71, 246, 0.3);
          border-radius: 4px;
        }
        .emoji-picker-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(144, 71, 246, 0.5);
        }
      `}</style>
    </div>
  );
};

export default EmojiPicker;
