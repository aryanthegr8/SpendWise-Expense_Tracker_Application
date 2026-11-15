const GridBackground = ({ children }) => (
  <div className="sw-app min-h-screen text-slate-100">
    <div className="sw-glow pointer-events-none fixed inset-0" aria-hidden="true" />
    <div className="relative min-h-screen">{children}</div>
  </div>
);
export default GridBackground;
