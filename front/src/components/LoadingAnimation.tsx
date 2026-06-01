interface LoadingAnimationProps {
  speed?: number;
}

const LoadingAnimation = ({ speed = 1 }: LoadingAnimationProps) => {
  const durationSeconds = Math.max(0.6, Math.min(2.2, 1.4 / speed));

  return (
    <div className="flex flex-col justify-center items-center h-full">
      <div
        className="relative size-[112px] rounded-full border border-income-border bg-income-bg shadow-glass"
        aria-hidden="true"
      >
        <div
          className="absolute inset-3 rounded-full border-[6px] border-transparent border-t-income-primary border-r-[var(--color-lesson-primary)]"
          style={{ animation: `spin ${durationSeconds}s linear infinite` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-icons text-income-primary text-[32px]">event_available</span>
        </div>
      </div>
      <div className="mt-4 text-center text-green-700 text-2xl font-bold font-sans animate-fadeInUp">
        EvaCalendar
      </div>
    </div>
  );
};

export default LoadingAnimation;
