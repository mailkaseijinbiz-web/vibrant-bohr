import { useMemo } from 'react';
import * as THREE from 'three';
import { Line, Text } from '@react-three/drei';

const dimensions = {
  totalWidth: 1.67,
  totalDepth: 2.40,
  woodHeight: 0.925,
  wheelHeight: 0.095,
  baseHeight: 1.05,
  frontCounterDepth: 0.45,
  rightCounterWidth: 0.30,
  leftCounterWidth: 0.30,
  topThickness: 0.03,
};

const colors = {
  wood: "#d2a878",
  top: "#e6cfa8",
  metal: "#b0b0b0",
  sheet: "rgba(255, 255, 255, 0.4)",
  wheel: "#333333",
  dimension: "#ef4444", // red-500
  punchedMetal: "#ffffff"
};

function CustomPoster({ position, rotation, args, imageUrl, onClick, text }: { position: [number, number, number], rotation?: [number, number, number], args: [number, number, number], imageUrl?: string, onClick?: (e: any) => void, text: string }) {
  const texture = useMemo(() => {
    if (!imageUrl) return null;
    const loader = new THREE.TextureLoader();
    return loader.load(imageUrl);
  }, [imageUrl]);

  return (
    <group position={position} rotation={rotation}>
      <mesh onClick={onClick} position={[0, 0, args[2]/2]}>
        <boxGeometry args={args} />
        <meshStandardMaterial color={texture ? "#ffffff" : "#d4d4d4"} map={texture || null} roughness={0.9} />
      </mesh>
      {!texture && (
        <Text position={[0, 0, args[2] + 0.001]} fontSize={0.15} color="#ffffff" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf" pointerEvents="none">
          {text}
        </Text>
      )}
    </group>
  );
}

interface BoothProps {
  showDimensions?: boolean;
  posterImages?: Record<string, string>;
  onPosterClick?: (id: string) => void;
}

export function Booth({ showDimensions = false, posterImages = {}, onPosterClick }: BoothProps) {
const rightCounterX = dimensions.totalWidth / 2 - dimensions.rightCounterWidth / 2;
const leftCounterX = -dimensions.totalWidth / 2 + dimensions.leftCounterWidth / 2;

const rightPoleX = dimensions.totalWidth / 2;
const leftPoleX = -dimensions.totalWidth / 2;

const polesZ = [
  0,
  -0.80,
  -1.60,
  -2.40,
];

const leftPoleH = 0.80;
const rightPoleH = 0.80;

const leftArchPoints = [
  [leftPoleX, dimensions.baseHeight + leftPoleH],
  [leftPoleX + 0.02, dimensions.baseHeight + 0.92], // Almost vertical up to ~900
  [leftPoleX + 0.20, dimensions.baseHeight + 1.15], // Gentle curve
  [leftPoleX + 0.45, dimensions.baseHeight + 1.25],
  [0, dimensions.baseHeight + 1.30]
];

const rightArchPoints = [
  [0, dimensions.baseHeight + 1.30],
  [rightPoleX - 0.45, dimensions.baseHeight + 1.25],
  [rightPoleX - 0.20, dimensions.baseHeight + 1.15],
  [rightPoleX - 0.02, dimensions.baseHeight + 0.92],
  [rightPoleX, dimensions.baseHeight + rightPoleH]
];

function Arch({ z }: { z: number }) {
  const curvePath = useMemo(() => {
    const leftCurve = new THREE.CatmullRomCurve3(
      leftArchPoints.map(p => new THREE.Vector3(p[0], p[1], z)),
      false, 'catmullrom', 0.5
    );
    const rightCurve = new THREE.CatmullRomCurve3(
      rightArchPoints.map(p => new THREE.Vector3(p[0], p[1], z)),
      false, 'catmullrom', 0.5
    );
    const path = new THREE.CurvePath<THREE.Vector3>();
    path.add(leftCurve);
    path.add(rightCurve);
    return path;
  }, [z]);

  return (
    <group>
      {/* Left Pole */}
      <mesh position={[leftPoleX, dimensions.baseHeight + leftPoleH / 2, z]}>
        <cylinderGeometry args={[0.015, 0.015, leftPoleH, 16]} />
        <meshStandardMaterial color={colors.metal} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Right Pole */}
      <mesh position={[rightPoleX, dimensions.baseHeight + rightPoleH / 2, z]}>
        <cylinderGeometry args={[0.015, 0.015, rightPoleH, 16]} />
        <meshStandardMaterial color={colors.metal} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Arch Tube */}
      <mesh>
        <tubeGeometry args={[curvePath, 40, 0.015, 8, false]} />
        <meshStandardMaterial color={colors.metal} metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function CanopySheet() {
  const depth = Math.abs(polesZ[3] - polesZ[0]);
  
  const archShape = useMemo(() => {
    const shape = new THREE.Shape();
    
    // Create right side curve (we draw from right to left or vice-versa, just need to be sequential)
    // To match the start at rightPoleX, we must start from the end of the rightArchPoints.
    const rightPoints2D = rightArchPoints.map(p => new THREE.Vector2(p[0], p[1])).reverse();
    const rightSpline = new THREE.SplineCurve(rightPoints2D);
    const rightCurvePoints = rightSpline.getPoints(25);

    // Left side curve (from center to left)
    const leftPoints2D = leftArchPoints.map(p => new THREE.Vector2(p[0], p[1])).reverse();
    const leftSpline = new THREE.SplineCurve(leftPoints2D);
    // Skip the first point of leftSpline because it's the exact same center point as the last of rightSpline
    const leftCurvePoints = leftSpline.getPoints(25).slice(1);

    const curvePoints = [...rightCurvePoints, ...leftCurvePoints];
    
    shape.moveTo(curvePoints[0].x, curvePoints[0].y);
    for (let i = 1; i < curvePoints.length; i++) {
      shape.lineTo(curvePoints[i].x, curvePoints[i].y);
    }
    // Add thickness
    for (let i = curvePoints.length - 1; i >= 0; i--) {
      shape.lineTo(curvePoints[i].x, curvePoints[i].y - 0.01);
    }
    shape.lineTo(curvePoints[0].x, curvePoints[0].y);
    return shape;
  }, []);

  const extrudeSettings = {
    steps: 1,
    depth: depth,
    bevelEnabled: false,
  };

  return (
    <mesh position={[0, 0, polesZ[3]]}>
      <extrudeGeometry args={[archShape, extrudeSettings]} />
      <meshPhysicalMaterial 
        color="#ffffff" 
        transparent={true} 
        opacity={0.6} 
        roughness={0.1}
        transmission={0.5}
        thickness={0.01}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function HotShowcase({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  const w = 0.45;
  const h = 0.45;
  const d = 0.30;
  
  return (
    <group position={position} rotation={rotation}>
      {/* Outer Case (Hollow Box) */}
      {/* Back Wall */}
      <mesh position={[0, h/2, -d/2 + 0.01]}>
        <boxGeometry args={[w, h, 0.02]} />
        <meshStandardMaterial color="#d8d8d8" metalness={0.8} roughness={0.45} />
      </mesh>
      {/* Top Wall */}
      <mesh position={[0, h - 0.01, 0]}>
        <boxGeometry args={[w, 0.02, d]} />
        <meshStandardMaterial color="#d8d8d8" metalness={0.8} roughness={0.45} />
      </mesh>
      {/* Bottom Wall */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[w, 0.02, d]} />
        <meshStandardMaterial color="#d8d8d8" metalness={0.8} roughness={0.45} />
      </mesh>
      {/* Left Wall */}
      <mesh position={[-w/2 + 0.01, h/2, 0]}>
        <boxGeometry args={[0.02, h, d]} />
        <meshStandardMaterial color="#d8d8d8" metalness={0.8} roughness={0.45} />
      </mesh>
      {/* Right Wall */}
      <mesh position={[w/2 - 0.01, h/2, 0]}>
        <boxGeometry args={[0.02, h, d]} />
        <meshStandardMaterial color="#d8d8d8" metalness={0.8} roughness={0.45} />
      </mesh>

      {/* Inner Cavity (Heated Orange Glow on Back Panel) */}
      <mesh position={[0, h/2, -d/2 + 0.021]}>
        <planeGeometry args={[w - 0.04, h - 0.04]} />
        <meshStandardMaterial color="#331100" emissive="#ff4400" emissiveIntensity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Glass Front removed because it wasn't rendering transparently properly */}
      {/* Middle Shelf (creating 2 tiers) */}
      <mesh position={[0, h/2, 0]}>
        <boxGeometry args={[w - 0.05, 0.01, d - 0.05]} />
        <meshStandardMaterial color="#cccccc" metalness={0.9} />
      </mesh>
      
      {/* Heating Elements (glowing rods) */}
      <mesh position={[0, h - 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.005, 0.005, w - 0.06, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ff3300" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, h/2 - 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.005, 0.005, w - 0.06, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ff3300" emissiveIntensity={2} />
      </mesh>

      {/* Food items (Takoyaki on trays: bottom floor and middle shelf) */}
      {[0.025, h/2 + 0.01].map((y, i) => (
        <group key={`food-shelf-${i}`} position={[0, y, 0]}>
          {[-0.1, 0.1].map((x, j) => (
            <group key={`tray-${i}-${j}`} position={[x, 0, 0]} rotation={[0, -Math.PI / 8, 0]}>
              {/* Paper boat/tray */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.10, 0.01, 0.16]} />
                <meshStandardMaterial color="#e8cd9c" roughness={0.9} />
              </mesh>
              {/* Takoyaki Balls (2 columns x 3 rows = 6 balls) */}
              {[-0.025, 0.025].map((bx, ci) => (
                [-0.05, 0, 0.05].map((bz, ri) => (
                  <mesh key={`tako-${ci}-${ri}`} position={[bx, 0.015, bz]}>
                    <sphereGeometry args={[0.02, 16, 16]} />
                    <meshStandardMaterial color="#b35900" roughness={0.9} />
                  </mesh>
                ))
              ))}
            </group>
          ))}
        </group>
      ))}
      {/* Internal warm light */}
      <pointLight position={[0, h/2, 0]} color="#ff5500" intensity={2} distance={1} />

      {/* Payment Method Sign on top */}
      <group position={[0, h + 0.1, d/3]} rotation={[-0.15, 0, 0]}>
        <mesh>
          <planeGeometry args={[0.3, 0.2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        <Text
          position={[0, 0.05, 0.005]}
          fontSize={0.03}
          color="#333333"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
        >
          PAYMENT METHODS
        </Text>
        {/* Fake payment logos (colorful rectangles) */}
        <mesh position={[-0.08, 0, 0.005]}>
          <planeGeometry args={[0.05, 0.03]} />
          <meshStandardMaterial color="#ef4444" /> {/* Red */}
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <planeGeometry args={[0.05, 0.03]} />
          <meshStandardMaterial color="#3b82f6" /> {/* Blue */}
        </mesh>
        <mesh position={[0.08, 0, 0.005]}>
          <planeGeometry args={[0.05, 0.03]} />
          <meshStandardMaterial color="#22c55e" /> {/* Green */}
        </mesh>
        <mesh position={[-0.04, -0.05, 0.005]}>
          <planeGeometry args={[0.05, 0.03]} />
          <meshStandardMaterial color="#f59e0b" /> {/* Yellow */}
        </mesh>
        <mesh position={[0.04, -0.05, 0.005]}>
          <planeGeometry args={[0.05, 0.03]} />
          <meshStandardMaterial color="#8b5cf6" /> {/* Purple */}
        </mesh>
      </group>
    </group>
  );
}

function DimensionLine({ start, end, label, offset = [0, 0, 0] }: { start: number[], end: number[], label: string, offset?: number[] }) {
  const mid = [
    (start[0] + end[0]) / 2 + offset[0], 
    (start[1] + end[1]) / 2 + offset[1], 
    (start[2] + end[2]) / 2 + offset[2]
  ] as [number, number, number];
  
  return (
    <group>
      <Line points={[start as [number, number, number], end as [number, number, number]]} color={colors.dimension} lineWidth={3} />
      <Text 
        position={mid} 
        color={colors.dimension} 
        fontSize={0.08} 
        outlineWidth={0.015} 
        outlineColor="#ffffff"
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
      >
        {label}
      </Text>
    </group>
  );
}

function DimensionsOverlay() {
  return (
    <group>
      {/* XYZ Axes Helper */}
      <axesHelper args={[3]} />
      <Text position={[3.2, 0, 0]} color="#ef4444" fontSize={0.15}>X</Text>
      <Text position={[0, 3.2, 0]} color="#22c55e" fontSize={0.15}>Y</Text>
      <Text position={[0, 0, 3.2]} color="#3b82f6" fontSize={0.15}>Z</Text>

      {/* Total Width (Front) */}
      <DimensionLine 
        start={[-dimensions.totalWidth/2, 0, 0.1]} 
        end={[dimensions.totalWidth/2, 0, 0.1]} 
        label="1670" 
        offset={[0, -0.1, 0]}
      />
      {/* Total Depth (Right Side) */}
      <DimensionLine 
        start={[dimensions.totalWidth/2 + 0.1, 0, 0]} 
        end={[dimensions.totalWidth/2 + 0.1, 0, -dimensions.totalDepth]} 
        label="2400" 
        offset={[0.1, 0, 0]}
      />
      {/* Base Height (Front) */}
      <DimensionLine 
        start={[-dimensions.totalWidth/2 - 0.1, 0, 0]} 
        end={[-dimensions.totalWidth/2 - 0.1, dimensions.baseHeight, 0]} 
        label="1050" 
        offset={[-0.1, 0, 0]}
      />
      {/* Inner width */}
      <DimensionLine 
        start={[-dimensions.totalWidth/2 + dimensions.leftCounterWidth, dimensions.baseHeight, -0.2]} 
        end={[dimensions.totalWidth/2 - dimensions.rightCounterWidth, dimensions.baseHeight, -0.2]} 
        label="1070" 
        offset={[0, 0.1, 0]}
      />
      {/* Counter Depth (Side) */}
      <DimensionLine 
        start={[dimensions.totalWidth/2 - dimensions.rightCounterWidth, dimensions.baseHeight, -0.1]} 
        end={[dimensions.totalWidth/2, dimensions.baseHeight, -0.1]} 
        label="300" 
        offset={[0, 0.1, 0]}
      />
      {/* Front Counter Depth */}
      <DimensionLine 
        start={[0.3, dimensions.baseHeight, 0]} 
        end={[0.3, dimensions.baseHeight, -dimensions.frontCounterDepth]} 
        label="450" 
        offset={[0.1, 0.1, 0]}
      />
      {/* Arch max height (from counter) */}
      <DimensionLine 
        start={[0, dimensions.baseHeight, -1.2]} 
        end={[0, dimensions.baseHeight + 1.30, -1.2]} 
        label="1300" 
        offset={[0.1, 0, 0]}
      />
      {/* Straight pole height */}
      <DimensionLine 
        start={[leftPoleX - 0.1, dimensions.baseHeight, -0.15]} 
        end={[leftPoleX - 0.1, dimensions.baseHeight + leftPoleH, -0.15]} 
        label="800" 
        offset={[-0.1, 0, 0]}
      />
    </group>
  );
}

export function Booth({ showDimensions = false }: { showDimensions?: boolean }) {
  const zDepthLeftRight = dimensions.totalDepth - dimensions.frontCounterDepth;
  const zPosLeftRight = -dimensions.frontCounterDepth - zDepthLeftRight / 2;

  return (
    <group>
      {/* Front Base */}
      <mesh position={[0, dimensions.wheelHeight + dimensions.woodHeight / 2, -dimensions.frontCounterDepth / 2]}>
        <boxGeometry args={[dimensions.totalWidth, dimensions.woodHeight, dimensions.frontCounterDepth]} />
        <meshStandardMaterial color={colors.wood} />
      </mesh>
      {/* Front Top */}
      <mesh position={[0, dimensions.baseHeight - dimensions.topThickness / 2, -dimensions.frontCounterDepth / 2]}>
        <boxGeometry args={[dimensions.totalWidth + 0.02, dimensions.topThickness, dimensions.frontCounterDepth + 0.02]} />
        <meshStandardMaterial color={colors.top} />
      </mesh>

      {/* Right Base */}
      <mesh position={[rightCounterX, dimensions.wheelHeight + dimensions.woodHeight / 2, zPosLeftRight]}>
        <boxGeometry args={[dimensions.rightCounterWidth, dimensions.woodHeight, zDepthLeftRight]} />
        <meshStandardMaterial color={colors.wood} />
      </mesh>
      {/* Right Top */}
      <mesh position={[rightCounterX, dimensions.baseHeight - dimensions.topThickness / 2, zPosLeftRight]}>
        <boxGeometry args={[dimensions.rightCounterWidth + 0.02, dimensions.topThickness, zDepthLeftRight + 0.02]} />
        <meshStandardMaterial color={colors.top} />
      </mesh>

      {/* Left Base */}
      <mesh position={[leftCounterX, dimensions.wheelHeight + dimensions.woodHeight / 2, zPosLeftRight]}>
        <boxGeometry args={[dimensions.leftCounterWidth, dimensions.woodHeight, zDepthLeftRight]} />
        <meshStandardMaterial color={colors.wood} />
      </mesh>
      {/* Left Base Punched Metal */}
      <mesh position={[leftPoleX - 0.001, dimensions.wheelHeight + dimensions.woodHeight / 2, -dimensions.totalDepth / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[dimensions.totalDepth, dimensions.woodHeight]} />
        <meshStandardMaterial color={colors.punchedMetal} roughness={0.7} metalness={0.1} />
      </mesh>
      
      {/* Posters on the Left Base (A1, A1, Corkboard) */}
      <group position={[leftPoleX - 0.002, dimensions.wheelHeight + dimensions.woodHeight / 2, -dimensions.totalDepth / 2]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Left A1 */}
        <CustomPoster 
          position={[-0.65, 0, 0]} 
          args={[0.594, 0.841, 0.002]} 
          imageUrl={posterImages['a1-left']}
          onClick={(e) => { e.stopPropagation(); onPosterClick?.('a1-left'); }}
          text="A1"
        />
        
        {/* Middle A1 */}
        <CustomPoster 
          position={[0, 0, 0]} 
          args={[0.594, 0.841, 0.002]} 
          imageUrl={posterImages['a1-middle']}
          onClick={(e) => { e.stopPropagation(); onPosterClick?.('a1-middle'); }}
          text="A1"
        />
        
        {/* Right Corkboard */}
        <group position={[0.65, 0, 0]}>
          {/* Wooden Frame (3cm thick) */}
          <mesh position={[0, 0, 0.015]}>
            <boxGeometry args={[0.594, 0.841, 0.03]} />
            <meshStandardMaterial color="#cda473" roughness={0.8} />
          </mesh>
          {/* Cork Inner (recessed, 2cm thick) */}
          <mesh position={[0, 0, 0.015]}>
            <boxGeometry args={[0.534, 0.781, 0.02]} />
            <meshStandardMaterial color="#b88d5b" roughness={1.0} />
          </mesh>
          {/* Photos pinned to the corkboard */}
          {[
            { x: -0.18, y: 0.28, rot: 0.15, color: '#e74c3c' },
            { x: 0.02, y: 0.32, rot: -0.05, color: '#3498db' },
            { x: 0.18, y: 0.25, rot: 0.2, color: '#2ecc71' },
            { x: -0.12, y: 0.12, rot: -0.15, color: '#f1c40f' },
            { x: 0.1, y: 0.08, rot: 0.08, color: '#9b59b6' },
            { x: -0.2, y: -0.05, rot: 0.05, color: '#e67e22' },
            { x: 0.2, y: -0.1, rot: -0.12, color: '#1abc9c' },
            { x: -0.05, y: -0.15, rot: -0.2, color: '#34495e' },
            { x: -0.18, y: -0.28, rot: 0.1, color: '#7f8c8d' },
            { x: 0.05, y: -0.32, rot: 0.05, color: '#d35400' },
            { x: 0.18, y: -0.28, rot: -0.18, color: '#c0392b' },
          ].map((photo, index) => (
            <group key={`photo-${index}`} position={[photo.x, photo.y, 0.026 + index * 0.001]} rotation={[0, 0, photo.rot]}>
              {/* Photo white border */}
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[0.12, 0.14]} />
                <meshStandardMaterial color="#ffffff" roughness={0.8} />
              </mesh>
              {/* Photo image area (colored square) */}
              <mesh position={[0, 0.01, 0.001]}>
                <planeGeometry args={[0.10, 0.10]} />
                <meshStandardMaterial color={photo.color} roughness={0.6} />
              </mesh>
              {/* Push pin */}
              <mesh position={[0, 0.055, 0.002]}>
                <sphereGeometry args={[0.005, 8, 8]} />
                <meshStandardMaterial color="#2c3e50" />
              </mesh>
            </group>
          ))}
        </group>
      </group>
      {/* Left Top */}
      <mesh position={[leftCounterX, dimensions.baseHeight - dimensions.topThickness / 2, zPosLeftRight]}>
        <boxGeometry args={[dimensions.leftCounterWidth + 0.02, dimensions.topThickness, zDepthLeftRight + 0.02]} />
        <meshStandardMaterial color={colors.top} />
      </mesh>

      {/* Wheels */}
      {[
        [-0.7, -0.1], [0.7, -0.1], 
        [-0.7, -2.3], [0.7, -2.3],
        [-0.7, -1.2], [0.7, -1.2]
      ].map((pos, i) => (
        <mesh key={`wheel-${i}`} position={[pos[0], dimensions.wheelHeight / 2, pos[1]]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[dimensions.wheelHeight / 2, dimensions.wheelHeight / 2, 0.05, 16]} />
          <meshStandardMaterial color={colors.wheel} roughness={0.8} />
        </mesh>
      ))}

      {/* Canopy */}
      <group>
        {polesZ.map((z, i) => (
          <Arch key={`arch-${i}`} z={z} />
        ))}
        <CanopySheet />
        
        {/* Horizontal Bars removed as requested */}
        {/* Center Top Horizontal Bar (Bone) */}
        <mesh position={[0, dimensions.baseHeight + 1.30, (polesZ[0] + polesZ[3]) / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, Math.abs(polesZ[3] - polesZ[0]), 16]} />
          <meshStandardMaterial color={colors.metal} metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Front horizontal bar removed as the posters are now on the side */}
      </group>

      {/* Dimensions Overlay */}
      {showDimensions && <DimensionsOverlay />}

      {/* 4 A2 Posters standing up from the left arch (facing X-direction) */}
      <group 
        position={[leftPoleX - 0.015, dimensions.baseHeight + leftPoleH + 0.594 / 2, -dimensions.totalDepth / 2]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        {[-1.5, -0.5, 0.5, 1.5].map((i) => {
          const posterW = 0.42;
          const posterH = 0.594;
          const gap = 0.03; // 3cm gap between posters
          const id = `a2-${i}`;
          return (
            <CustomPoster 
              key={id}
              position={[i * (posterW + gap), 0, 0]} 
              args={[posterW, posterH, 0.002]} 
              imageUrl={posterImages[id]}
              onClick={(e) => { e.stopPropagation(); onPosterClick?.(id); }}
              text="A2"
            />
          );
        })}
      </group>

      {/* Top Banner (LOGO) */}
      <group 
        position={[leftPoleX - 0.015, dimensions.baseHeight + leftPoleH + 0.594 + 0.20, -dimensions.totalDepth / 2]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <mesh>
          <planeGeometry args={[2.2, 0.35]} />
          <meshStandardMaterial color="#222222" roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.25}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
          letterSpacing={0.1}
        >
          LOGO
        </Text>
      </group>
      {/* Hot Showcase (温め機) */}
      <HotShowcase 
        position={[leftCounterX, dimensions.baseHeight, -2.1]} 
        rotation={[0, -Math.PI / 2, 0]} 
      />
    </group>
  );
}
