import { BookOpen, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useEffect, useState } from "react";

const ICONS = Array.from({ length: 18 }, (_, i) => (i % 2 === 0 ? BookOpen : Star));

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const FloatingIconsBackground = () => {
  // Only render on client to avoid hydration error
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const iconConfigs = useMemo(() => {
    return ICONS.map((Icon, i) => ({
      Icon,
      top: random(5, 80),
      left: random(5, 90),
      size: random(24, 36),
      duration: random(10, 18),
      delay: random(0, 6),
      rotate: random(-30, 30),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!mounted) return null;

  const iconColor = '#2563eb'; // blue in all modes

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {iconConfigs.map((cfg, i) => (
        <motion.div
          key={i}
          initial={{ y: 0, rotate: 0, opacity: 0 }}
          animate={{
            y: [0, cfg.rotate, 0],
            rotate: [0, cfg.rotate, 0],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: cfg.duration,
            repeat: Infinity,
            repeatType: "loop",
            delay: cfg.delay,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            top: `${cfg.top}%`,
            left: `${cfg.left}%`,
            width: cfg.size,
            height: cfg.size,
            zIndex: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <cfg.Icon className="w-full h-full" color={iconColor} stroke={iconColor} fill={iconColor} />
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingIconsBackground; 