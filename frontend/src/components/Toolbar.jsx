export const ToolbarButton = ({ onClick, active, disabled, children, title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-1.5 rounded-md transition-all flex items-center justify-center min-w-[32px] border border-transparent
            ${active ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'text-slate-600 hover:bg-slate-100 hover:border-slate-200'}
            ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        `}
    >
        {children}
    </button>
);