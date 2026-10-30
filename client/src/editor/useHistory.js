import { useReducer, useCallback } from "react";

// Undo/redo for the page state ({ blocks, style }). Consecutive edits that pass
// the same `tag` (e.g. typing in one heading) coalesce into a single history
// entry so undo jumps back a meaningful step, not one keystroke.
function reducer(state, action) {
  switch (action.type) {
    case "reset":
      return { present: action.value, past: [], future: [], lastTag: null };
    case "set": {
      const coalesce = action.tag && action.tag === state.lastTag;
      return {
        present: action.value,
        past: coalesce ? state.past : [...state.past, state.present],
        future: [],
        lastTag: action.tag || null,
      };
    }
    case "undo": {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      return {
        present: prev,
        past: state.past.slice(0, -1),
        future: [state.present, ...state.future],
        lastTag: null,
      };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        present: next,
        past: [...state.past, state.present],
        future: state.future.slice(1),
        lastTag: null,
      };
    }
    default:
      return state;
  }
}

export function useHistory(initial) {
  const [state, dispatch] = useReducer(reducer, { present: initial, past: [], future: [], lastTag: null });

  const set = useCallback((value, opts = {}) => dispatch({ type: "set", value, tag: opts.tag }), []);
  const reset = useCallback((value) => dispatch({ type: "reset", value }), []);
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  return {
    state: state.present,
    set,
    reset,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
