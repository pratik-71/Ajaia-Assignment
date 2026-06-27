import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="mention-dropdown" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '0.5rem', border: '1px solid var(--border-color)', minWidth: '150px' }}>
      {props.items.length ? (
        props.items.map((item: string, index: number) => (
          <button
            className={`mention-item ${index === selectedIndex ? 'is-selected' : ''}`}
            key={index}
            onClick={() => selectItem(index)}
            style={{ 
              display: 'block', 
              width: '100%', 
              textAlign: 'left', 
              padding: '0.5rem', 
              border: 'none', 
              background: index === selectedIndex ? 'var(--bg-secondary)' : 'transparent',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {item}
          </button>
        ))
      ) : (
        <div style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>No results</div>
      )}
    </div>
  );
});
