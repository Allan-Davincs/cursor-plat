import { motion } from 'framer-motion';

export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizeMap = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={`${sizeMap[size]} border-3 border-gray-200 dark:border-gray-700 border-t-primary-500 rounded-full`}
        style={{ borderWidth: '3px' }}
      />
      {text && <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">{text}</p>}
    </div>
  );
}
