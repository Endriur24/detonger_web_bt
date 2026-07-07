/// <reference types="vite/client" />

interface BluetoothDevice {
  id: string;
  name: string | null;
  gatt: BluetoothRemoteGATTServer | null;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
  value: DataView | null;
  writeValue(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

type BluetoothServiceUUID = string | number;
type BluetoothCharacteristicUUID = string | number;

interface Navigator {
  bluetooth: {
    requestDevice(options?: {
      filters?: Array<{ namePrefix?: string; services?: BluetoothServiceUUID[] }>;
      optionalServices?: BluetoothServiceUUID[];
    }): Promise<BluetoothDevice>;
  };
}
