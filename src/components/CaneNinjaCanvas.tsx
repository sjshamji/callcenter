"use client"

import { useEffect, useRef } from 'react'
import Matter from 'matter-js'

interface CaneNinjaCanvasProps {
  onScoreChange: (score: number) => void
  onGameOver: () => void
  isPlaying: boolean
}

const CaneNinjaCanvas = ({ onScoreChange, onGameOver, isPlaying }: CaneNinjaCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  const runnerRef = useRef<Matter.Runner | null>(null)
  const renderRef = useRef<Matter.Render | null>(null)
  const scoreRef = useRef(0)

  useEffect(() => {
    if (!isPlaying || !canvasRef.current) return

    // Initialize Matter.js
    const engine = Matter.Engine.create()
    engineRef.current = engine

    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: '#f0f0f0'
      }
    })
    renderRef.current = render

    const runner = Matter.Runner.create()
    runnerRef.current = runner

    // Create ground
    const ground = Matter.Bodies.rectangle(400, 590, 800, 20, {
      isStatic: true,
      render: { fillStyle: '#2c3e50' }
    })

    // Create player (cane)
    const player = Matter.Bodies.rectangle(400, 550, 100, 10, {
      isStatic: true,
      render: { fillStyle: '#27ae60' }
    })

    Matter.Composite.add(engine.world, [ground, player])

    // Mouse control
    const mouse = Matter.Mouse.create(render.canvas)
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    })

    Matter.Composite.add(engine.world, mouseConstraint)
    render.mouse = mouse

    // Game loop
    let lastSpawnTime = 0
    const spawnInterval = 2000 // Spawn target every 2 seconds

    Matter.Events.on(engine, 'beforeUpdate', () => {
      const currentTime = Date.now()
      if (currentTime - lastSpawnTime > spawnInterval) {
        // Spawn target
        const target = Matter.Bodies.circle(
          Math.random() * 700 + 50,
          50,
          15,
          {
            render: { fillStyle: '#e74c3c' },
            restitution: 0.8
          }
        )
        Matter.Composite.add(engine.world, target)
        lastSpawnTime = currentTime
      }

      // Check collisions
      const collisions = Matter.Query.collides(player, Matter.Composite.allBodies(engine.world))
      collisions.forEach(collision => {
        const bodyA = collision.bodyA
        const bodyB = collision.bodyB
        
        if ((bodyA === player && bodyB.render.fillStyle === '#e74c3c') ||
            (bodyB === player && bodyA.render.fillStyle === '#e74c3c')) {
          // Remove target and update score
          Matter.Composite.remove(engine.world, bodyA.render.fillStyle === '#e74c3c' ? bodyA : bodyB)
          scoreRef.current += 10
          onScoreChange(scoreRef.current)
        }
      })

      // Check for game over (targets hitting ground)
      const targets = Matter.Composite.allBodies(engine.world).filter(
        body => body.render.fillStyle === '#e74c3c' && body.position.y > 580
      )
      if (targets.length > 0) {
        onGameOver()
      }
    })

    // Start the engine and renderer
    Matter.Runner.run(runner, engine)
    Matter.Render.run(render)

    // Cleanup
    return () => {
      if (runnerRef.current) Matter.Runner.stop(runner)
      if (renderRef.current) Matter.Render.stop(render)
      if (engineRef.current) Matter.Engine.clear(engine)
      if (canvasRef.current) {
        const parent = canvasRef.current.parentNode
        if (parent) parent.removeChild(canvasRef.current)
      }
    }
  }, [isPlaying, onScoreChange, onGameOver])

  return <canvas ref={canvasRef} />
}

export default CaneNinjaCanvas 