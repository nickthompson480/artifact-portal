const VIS_COLORS = {
  public:   'var(--cat-teal)',
  unlisted: 'var(--cat-amber)',
  private:  'var(--text3)',
};
const VIS_LABELS = { public: 'Public', unlisted: 'Unlisted', private: 'Private' };

export function VisibilityDot({ visibility }) {
  return (
    <span
      title={VIS_LABELS[visibility] || 'Private'}
      style={{
        display: 'inline-block',
        width: 5, height: 5,
        borderRadius: '50%',
        background: VIS_COLORS[visibility] || 'var(--text3)',
        flexShrink: 0,
        marginTop: 1,
      }}
    />
  );
}
