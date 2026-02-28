import { motion } from "framer-motion";

function AnimatedPage({ children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mx-auto w-full max-w-7xl px-4 pb-14 pt-6 sm:px-6 lg:px-8"
    >
      {children}
    </motion.section>
  );
}

export default AnimatedPage;
