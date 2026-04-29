const RETRO_FORMATS = {
  'went-well-improve': {
    label: 'Went Well / Improve / Actions',
    description: 'What went well, what to improve, and action items',
    columns: [
      { id: 'went-well', label: 'Went Well', emoji: '👍', accent: '#16a34a' },
      { id: 'improve',   label: 'Improve',   emoji: '🔧', accent: '#ea580c' },
      { id: 'actions',   label: 'Actions',   emoji: '📋', accent: '#2563eb' },
    ],
  },
  'start-stop-continue': {
    label: 'Start / Stop / Continue',
    description: 'Classic format: what to start, stop, and keep doing',
    columns: [
      { id: 'start',    label: 'Start',    emoji: '🚀', accent: '#16a34a' },
      { id: 'stop',     label: 'Stop',     emoji: '🛑', accent: '#dc2626' },
      { id: 'continue', label: 'Continue', emoji: '✅', accent: '#2563eb' },
    ],
  },
  '4ls': {
    label: '4Ls',
    description: 'Liked, Learned, Lacked, Longed For',
    columns: [
      { id: 'liked',      label: 'Liked',      emoji: '❤️',  accent: '#16a34a' },
      { id: 'learned',    label: 'Learned',    emoji: '📚', accent: '#2563eb' },
      { id: 'lacked',     label: 'Lacked',     emoji: '⚠️',  accent: '#ea580c' },
      { id: 'longed-for', label: 'Longed For', emoji: '🌟', accent: '#7c3aed' },
    ],
  },
  'mad-sad-glad': {
    label: 'Mad / Sad / Glad',
    description: 'Emotion-based: what made you mad, sad, or glad',
    columns: [
      { id: 'mad',  label: 'Mad',  emoji: '😡', accent: '#dc2626' },
      { id: 'sad',  label: 'Sad',  emoji: '😢', accent: '#2563eb' },
      { id: 'glad', label: 'Glad', emoji: '😊', accent: '#16a34a' },
    ],
  },
};

const VALID_FORMAT_IDS = Object.keys(RETRO_FORMATS);

function getFormat(formatId) {
  return RETRO_FORMATS[formatId] || null;
}

function getColumns(formatId) {
  const fmt = RETRO_FORMATS[formatId];
  return fmt ? fmt.columns : [];
}

function isValidColumnId(formatId, columnId) {
  const cols = getColumns(formatId);
  return cols.some(c => c.id === columnId);
}

module.exports = { RETRO_FORMATS, VALID_FORMAT_IDS, getFormat, getColumns, isValidColumnId };
