// <SkillInput value={['React']} onChange={setSkills} max={10} />
// Type and press Enter or comma to add; click a chip to remove; suggestions appear below.
import { useState } from 'react';
import { SKILL_SUGGESTIONS } from '../lib/constants.js';

export default function SkillInput({ value = [], onChange, max = 10, id, invalid }) {
  const [text, setText] = useState('');
  const has = (s) => value.some((v) => v.toLowerCase() === s.toLowerCase());

  const add = (raw) => {
    const s = raw.trim().slice(0, 30);
    if (!s || has(s) || value.length >= max) return;
    onChange([...value, s]);
    setText('');
  };
  const remove = (s) => onChange(value.filter((v) => v !== s));

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(text);
    } else if (e.key === 'Backspace' && !text && value.length) {
      remove(value[value.length - 1]);
    }
  };

  const suggestions = SKILL_SUGGESTIONS.filter((s) => !has(s) && s.toLowerCase().includes(text.toLowerCase())).slice(0, 8);

  return (
    <div className="skillinput">
      <div className={`skillinput-box input${invalid ? ' invalid' : ''}`}>
        {value.map((s) => (
          <button key={s} type="button" className="chip chip-removable" onClick={() => remove(s)} aria-label={`Remove ${s}`}>
            {s} ×
          </button>
        ))}
        <input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => text && add(text)}
          placeholder={value.length >= max ? `Up to ${max} skills` : 'Type a skill and press Enter'}
          disabled={value.length >= max}
        />
      </div>
      {suggestions.length > 0 && value.length < max && (
        <div className="skillpick" aria-label="Suggestions">
          {suggestions.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => add(s)}>+ {s}</button>
          ))}
        </div>
      )}
    </div>
  );
}
