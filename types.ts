
export type WaveformType = 'SINE' | 'SQUARE' | 'TRIANGLE' | 'SAWTOOTH';
export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';

export interface ScopeChannelConfig {
  enabled: boolean;
  scale: number; // V/div
  offset: number;
  color: string;
}

export interface GeneratorConfig {
  enabled: boolean;
  type: WaveformType;
  frequency: number; // Hz
  amplitude: number; // Vpp
  offset: number; // V
}

export interface PWMConfig {
  enabled: boolean;
  frequency: number;
  dutyCycle: number; // 0-100
}

export interface DCConfig {
  voltage: number; // -5 to +5
}

export interface SpectrumConfig {
  enabled: boolean;
  range: number; // Max frequency displayed
  window: 'RECT' | 'HANNING' | 'HAMMING';
}

export interface NetworkConfig {
  startFreq: number;
  stopFreq: number;
  points: number;
  running: boolean;
}

export interface InstrumentState {
  connectionStatus: ConnectionStatus;
  scope: {
    ch1: ScopeChannelConfig;
    ch2: ScopeChannelConfig;
    timebase: number; // s/div
    triggerMode: 'AUTO' | 'SINGLE';
    triggerLevel: number;
    isArmed: boolean;
  };
  generator: GeneratorConfig;
  pwm: PWMConfig;
  dc: DCConfig;
  logicAnalyzer: {
    enabled: boolean;
    channels: boolean[]; // 16 channels
    sampleRate: number;
    triggerMode: 'AUTO' | 'SINGLE';
    isArmed: boolean;
  };
  spectrum: SpectrumConfig;
  network: NetworkConfig;
}
