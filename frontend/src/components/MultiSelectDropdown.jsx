import React, { useState, useRef, useEffect } from 'react';

const MultiSelectDropdown = ({ options, selected, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCheckboxChange = (option, isChecked) => {
    if (option === "Tous les champs") {
      onChange(["Tous les champs"]);
    } else {
      let newSelected = selected.filter(x => x !== "Tous les champs");
      if (isChecked) newSelected.push(option);
      else newSelected = newSelected.filter(x => x !== option);
      
      if (newSelected.length === 0) newSelected = ["Tous les champs"];
      onChange(newSelected);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', width: '300px' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px 15px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          backgroundColor: '#fff',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px', color: '#334155' }}>
          {selected.includes("Tous les champs") ? label : selected.join(', ')}
        </span>
        <span style={{ marginLeft: '10px', fontSize: '10px', color: '#64748b' }}>▼</span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          backgroundColor: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          zIndex: 50,
          maxHeight: '250px',
          overflowY: 'auto',
          padding: '8px 0'
        }}>
          {options.map(option => (
            <label 
              key={option} 
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 15px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#334155',
                transition: 'background 0.2s',
                margin: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <input 
                type="checkbox" 
                checked={selected.includes(option)}
                onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                style={{ marginRight: '10px', cursor: 'pointer' }}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
