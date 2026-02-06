"use client"
import { useEffect, useRef, useState } from "react"

type Stat = {
  endValue: number
  label: string
  color: string
  formatter: (value: number) => string
}

const stats: Stat[] = [
  {
    endValue: 100,
    label: "Utilisateurs Actifs",
    color: "light-blue",
    formatter: (value) => `${Math.round(value)}K+`,
  },
  {
    endValue: 1_200,
    label: "Intégrations",
    color: "mint",
    formatter: (value) => `${Math.round(value).toLocaleString()}+`,
  },
  {
    endValue: 50,
    label: "Tâches Automatisées",
    color: "soft-yellow",
    formatter: (value) => `${Math.round(value)}M+`,
  },
  {
    endValue: 99.9,
    label: "Disponibilité SLA",
    color: "light-blue",
    formatter: (value) => `${value.toFixed(1)}%`,
  },
]

export function StatsSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const node = sectionRef.current
    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <section ref={sectionRef} className="bg-transparent px-4 py-16">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="mb-2 text-4xl font-bold text-navy md:text-5xl dark:text-white">
                <AnimatedCounter endValue={stat.endValue} formatter={stat.formatter} isActive={hasAnimated} />
              </div>
              <div className="text-sm font-medium text-muted-foreground md:text-base">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

interface AnimatedCounterProps {
  endValue: number
  formatter: (value: number) => string
  duration?: number
  isActive: boolean
}

function AnimatedCounter({ endValue, formatter, duration = 3000, isActive }: AnimatedCounterProps) {
  const [currentValue, setCurrentValue] = useState(0)
  const frameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isActive) {
      return
    }

    startTimeRef.current = null

    const tick = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      const nextValue = progress >= 1 ? endValue : endValue * easedProgress

      setCurrentValue(nextValue)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [duration, endValue, isActive])

  const displayValue = formatter(Math.min(currentValue, endValue))

  return <span>{displayValue}</span>
}
