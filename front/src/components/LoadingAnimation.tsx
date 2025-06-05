import type { LottieRefCurrentProps } from 'lottie-react';
import Lottie from 'lottie-react';
import React, { useEffect, useRef } from 'react';
import animationData from '../../loading_anim.json';

interface LoadingAnimationProps {
  speed?: number;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ speed = 1 }) => {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(speed);
    }
  }, [speed]);

  return (
    <div className="flex flex-col justify-center items-center h-full">
      <div className="flex justify-center items-center">
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          className="w-[150px] h-[150px]"
          loop={true}
          autoplay={true}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid slice',
          }}
        />
      </div>
      <div className="mt-4 text-center text-green-700 text-2xl font-bold font-sans animate-fadeInUp">
        Zyaka's Calendar
      </div>
    </div>
  );
};

export default LoadingAnimation;
