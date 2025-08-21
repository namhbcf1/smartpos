// Computer Component Compatibility Checker
// ComputerPOS Pro - Vietnamese Computer Hardware Store POS System

export interface ComponentSpecs {
  id: string;
  name: string;
  category: ComponentCategory;
  specifications: Record<string, any>;
  compatibility_info?: Record<string, any>;
}

export type ComponentCategory = 
  | 'CPU' 
  | 'GPU' 
  | 'RAM' 
  | 'MOTHERBOARD' 
  | 'STORAGE' 
  | 'PSU' 
  | 'CASE' 
  | 'COOLING';

export interface CompatibilityIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  message_vi: string;
  components: string[];
  suggestion?: string;
  suggestion_vi?: string;
}

export interface CompatibilityResult {
  isCompatible: boolean;
  issues: CompatibilityIssue[];
  powerRequirement: number; // Watts
  estimatedPrice: number; // VND cents
}

/**
 * Vietnamese component category names
 */
export const COMPONENT_CATEGORIES_VI = {
  CPU: 'Bộ xử lý',
  GPU: 'Card đồ họa',
  RAM: 'Bộ nhớ RAM',
  MOTHERBOARD: 'Bo mạch chủ',
  STORAGE: 'Ổ cứng',
  PSU: 'Nguồn máy tính',
  CASE: 'Vỏ case',
  COOLING: 'Tản nhiệt'
} as const;

/**
 * Socket compatibility matrix
 */
const SOCKET_COMPATIBILITY = {
  // Intel sockets
  'LGA1700': ['12th Gen Intel', '13th Gen Intel', '14th Gen Intel'],
  'LGA1200': ['10th Gen Intel', '11th Gen Intel'],
  'LGA1151': ['6th Gen Intel', '7th Gen Intel', '8th Gen Intel', '9th Gen Intel'],
  
  // AMD sockets
  'AM5': ['Ryzen 7000 Series', 'Ryzen 8000 Series'],
  'AM4': ['Ryzen 1000 Series', 'Ryzen 2000 Series', 'Ryzen 3000 Series', 'Ryzen 4000 Series', 'Ryzen 5000 Series'],
  'TR4': ['Threadripper 1000 Series', 'Threadripper 2000 Series'],
  'sTRX4': ['Threadripper 3000 Series', 'Threadripper PRO 3000 Series']
};

/**
 * RAM compatibility checker
 */
function checkRAMCompatibility(motherboard: ComponentSpecs, ram: ComponentSpecs[]): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  
  const mbSpecs = motherboard.specifications;
  const maxRAM = mbSpecs.max_memory || 128; // GB
  const ramSlots = mbSpecs.memory_slots || 4;
  const supportedTypes = mbSpecs.memory_type || ['DDR4'];
  
  let totalRAM = 0;
  const ramTypes = new Set<string>();
  
  ram.forEach(ramModule => {
    const ramSpecs = ramModule.specifications;
    totalRAM += ramSpecs.capacity || 0;
    ramTypes.add(ramSpecs.type || 'DDR4');
  });
  
  // Check total RAM capacity
  if (totalRAM > maxRAM) {
    issues.push({
      severity: 'error',
      message: `Total RAM (${totalRAM}GB) exceeds motherboard limit (${maxRAM}GB)`,
      message_vi: `Tổng RAM (${totalRAM}GB) vượt quá giới hạn bo mạch chủ (${maxRAM}GB)`,
      components: [motherboard.id, ...ram.map(r => r.id)]
    });
  }
  
  // Check RAM slot count
  if (ram.length > ramSlots) {
    issues.push({
      severity: 'error',
      message: `Too many RAM modules (${ram.length}) for available slots (${ramSlots})`,
      message_vi: `Quá nhiều thanh RAM (${ram.length}) so với số khe cắm (${ramSlots})`,
      components: [motherboard.id, ...ram.map(r => r.id)]
    });
  }
  
  // Check RAM type compatibility
  ramTypes.forEach(type => {
    if (!supportedTypes.includes(type)) {
      issues.push({
        severity: 'error',
        message: `RAM type ${type} not supported by motherboard`,
        message_vi: `Loại RAM ${type} không được bo mạch chủ hỗ trợ`,
        components: [motherboard.id, ...ram.filter(r => r.specifications.type === type).map(r => r.id)]
      });
    }
  });
  
  return issues;
}

/**
 * CPU-Motherboard compatibility checker
 */
function checkCPUMotherboardCompatibility(cpu: ComponentSpecs, motherboard: ComponentSpecs): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  
  const cpuSocket = cpu.specifications.socket;
  const mbSocket = motherboard.specifications.socket;
  
  if (cpuSocket !== mbSocket) {
    issues.push({
      severity: 'error',
      message: `CPU socket ${cpuSocket} incompatible with motherboard socket ${mbSocket}`,
      message_vi: `Socket CPU ${cpuSocket} không tương thích với socket bo mạch chủ ${mbSocket}`,
      components: [cpu.id, motherboard.id],
      suggestion: 'Choose CPU and motherboard with matching sockets',
      suggestion_vi: 'Chọn CPU và bo mạch chủ có socket tương thích'
    });
  }
  
  // Check chipset compatibility
  const cpuGeneration = cpu.specifications.generation;
  const mbChipset = motherboard.specifications.chipset;
  
  if (cpuSocket && SOCKET_COMPATIBILITY[cpuSocket as keyof typeof SOCKET_COMPATIBILITY]) {
    const supportedGenerations = SOCKET_COMPATIBILITY[cpuSocket as keyof typeof SOCKET_COMPATIBILITY];
    if (!supportedGenerations.some(gen => cpuGeneration?.includes(gen))) {
      issues.push({
        severity: 'warning',
        message: `CPU generation may not be fully supported by motherboard chipset`,
        message_vi: `Thế hệ CPU có thể không được chipset bo mạch chủ hỗ trợ đầy đủ`,
        components: [cpu.id, motherboard.id]
      });
    }
  }
  
  return issues;
}

/**
 * Power supply compatibility checker
 */
function checkPowerSupplyCompatibility(components: ComponentSpecs[], psu: ComponentSpecs): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  
  let totalPowerDraw = 0;
  
  components.forEach(component => {
    const power = component.specifications.power_consumption || 0;
    totalPowerDraw += power;
  });
  
  const psuWattage = psu.specifications.wattage || 0;
  const recommendedWattage = Math.ceil(totalPowerDraw * 1.2); // 20% headroom
  
  if (psuWattage < totalPowerDraw) {
    issues.push({
      severity: 'error',
      message: `PSU wattage (${psuWattage}W) insufficient for system power draw (${totalPowerDraw}W)`,
      message_vi: `Công suất nguồn (${psuWattage}W) không đủ cho hệ thống (${totalPowerDraw}W)`,
      components: [psu.id, ...components.map(c => c.id)],
      suggestion: `Recommend at least ${recommendedWattage}W PSU`,
      suggestion_vi: `Khuyến nghị nguồn ít nhất ${recommendedWattage}W`
    });
  } else if (psuWattage < recommendedWattage) {
    issues.push({
      severity: 'warning',
      message: `PSU wattage (${psuWattage}W) may be tight for system (${totalPowerDraw}W)`,
      message_vi: `Công suất nguồn (${psuWattage}W) có thể hơi ít cho hệ thống (${totalPowerDraw}W)`,
      components: [psu.id],
      suggestion: `Consider ${recommendedWattage}W+ PSU for better efficiency`,
      suggestion_vi: `Nên chọn nguồn ${recommendedWattage}W+ để hiệu quả hơn`
    });
  }
  
  return issues;
}

/**
 * Case compatibility checker
 */
function checkCaseCompatibility(components: ComponentSpecs[], pcCase: ComponentSpecs): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  
  const caseSpecs = pcCase.specifications;
  const maxGPULength = caseSpecs.max_gpu_length || 300; // mm
  const maxCPUCoolerHeight = caseSpecs.max_cpu_cooler_height || 160; // mm
  
  // Check GPU clearance
  const gpu = components.find(c => c.category === 'GPU');
  if (gpu) {
    const gpuLength = gpu.specifications.length || 0;
    if (gpuLength > maxGPULength) {
      issues.push({
        severity: 'error',
        message: `GPU length (${gpuLength}mm) exceeds case clearance (${maxGPULength}mm)`,
        message_vi: `Chiều dài GPU (${gpuLength}mm) vượt quá khoảng trống case (${maxGPULength}mm)`,
        components: [gpu.id, pcCase.id]
      });
    }
  }
  
  // Check CPU cooler clearance
  const cooler = components.find(c => c.category === 'COOLING');
  if (cooler) {
    const coolerHeight = cooler.specifications.height || 0;
    if (coolerHeight > maxCPUCoolerHeight) {
      issues.push({
        severity: 'error',
        message: `CPU cooler height (${coolerHeight}mm) exceeds case clearance (${maxCPUCoolerHeight}mm)`,
        message_vi: `Chiều cao tản nhiệt CPU (${coolerHeight}mm) vượt quá khoảng trống case (${maxCPUCoolerHeight}mm)`,
        components: [cooler.id, pcCase.id]
      });
    }
  }
  
  return issues;
}

/**
 * Main compatibility checker function
 */
export function checkPCCompatibility(components: ComponentSpecs[]): CompatibilityResult {
  const issues: CompatibilityIssue[] = [];
  let totalPowerDraw = 0;
  let estimatedPrice = 0;
  
  // Group components by category
  const componentsByCategory = components.reduce((acc, component) => {
    if (!acc[component.category]) {
      acc[component.category] = [];
    }
    acc[component.category].push(component);
    return acc;
  }, {} as Record<ComponentCategory, ComponentSpecs[]>);
  
  // Calculate total power and price
  components.forEach(component => {
    totalPowerDraw += component.specifications.power_consumption || 0;
    estimatedPrice += component.specifications.price || 0;
  });
  
  // Check CPU-Motherboard compatibility
  const cpu = componentsByCategory.CPU?.[0];
  const motherboard = componentsByCategory.MOTHERBOARD?.[0];
  if (cpu && motherboard) {
    issues.push(...checkCPUMotherboardCompatibility(cpu, motherboard));
  }
  
  // Check RAM compatibility
  const ram = componentsByCategory.RAM || [];
  if (motherboard && ram.length > 0) {
    issues.push(...checkRAMCompatibility(motherboard, ram));
  }
  
  // Check PSU compatibility
  const psu = componentsByCategory.PSU?.[0];
  if (psu) {
    issues.push(...checkPowerSupplyCompatibility(components, psu));
  }
  
  // Check case compatibility
  const pcCase = componentsByCategory.CASE?.[0];
  if (pcCase) {
    issues.push(...checkCaseCompatibility(components, pcCase));
  }
  
  const hasErrors = issues.some(issue => issue.severity === 'error');
  
  return {
    isCompatible: !hasErrors,
    issues,
    powerRequirement: totalPowerDraw,
    estimatedPrice
  };
}

/**
 * Get compatibility suggestions for a component category
 */
export function getCompatibilitySuggestions(
  existingComponents: ComponentSpecs[], 
  targetCategory: ComponentCategory
): string[] {
  const suggestions: string[] = [];
  
  const motherboard = existingComponents.find(c => c.category === 'MOTHERBOARD');
  
  switch (targetCategory) {
    case 'CPU':
      if (motherboard) {
        const socket = motherboard.specifications.socket;
        suggestions.push(`Chọn CPU có socket ${socket} để tương thích với bo mạch chủ`);
      }
      break;
      
    case 'RAM':
      if (motherboard) {
        const memoryType = motherboard.specifications.memory_type?.[0] || 'DDR4';
        const maxMemory = motherboard.specifications.max_memory || 128;
        suggestions.push(`Chọn RAM loại ${memoryType}, tối đa ${maxMemory}GB`);
      }
      break;
      
    case 'GPU':
      const pcCase = existingComponents.find(c => c.category === 'CASE');
      if (pcCase) {
        const maxLength = pcCase.specifications.max_gpu_length || 300;
        suggestions.push(`Chọn GPU có chiều dài tối đa ${maxLength}mm`);
      }
      break;
  }
  
  return suggestions;
}
