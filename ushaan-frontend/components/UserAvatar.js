'use client';

import { useState, useEffect } from 'react';

export default function UserAvatar({ user, className = "w-8 h-8 rounded-lg", gradient = "from-amber-400 to-orange-500" }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = user?.photoUrl;
  const firstLetter = user?.name?.[0]?.toUpperCase() || '?';

  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

  if (photoUrl && !imgError) {
    return (
      <img
        src={`${process.env.NEXT_PUBLIC_API_URL}${photoUrl}`}
        alt={user.name || "User Avatar"}
        onError={() => setImgError(true)}
        className={`${className} object-cover`}
      />
    );
  }

  return (
    <div className={`${className} bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black shrink-0 select-none`}>
      {firstLetter}
    </div>
  );
}
