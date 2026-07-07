/**
 * DothanTech Printer Library - Constants
 */
import { PaperType } from './types';
export declare const START_BYTE = 31;
export declare const CMD_FEED_LINES = 74;
export declare const CMD_PAPER_TYPE = 66;
export declare const CMD_DENSITY = 67;
export declare const CMD_SPEED = 68;
export declare const CMD_GAP_SPACING = 69;
export declare const CMD_MOTOR_MODE = 71;
export declare const CMD_AUTO_POWEROFF = 72;
export declare const CMD_QUERY_STATUS = 112;
export declare const CMD_QUERY_DPI = 113;
export declare const CMD_QUERY_WIDTH = 114;
export declare const CMD_QUERY_STATS = 115;
export declare const CMD_MANUFACTURER = 117;
export declare const CMD_DEVICE_NAME = 121;
export declare const CMD_DEVICE_VERSION = 122;
export declare const CMD_SW_VERSION = 124;
export declare const CMD_PRINT_INIT = 32;
export declare const CMD_PRINT_LINE = 33;
export declare const CMD_LINE_WIDTH = 39;
export declare const CMD_PRINT_END = 40;
export declare const PaperTypeNames: Record<PaperType, string>;
export declare const DEFAULT_CONFIG: {
    readonly serviceUUID: "0000ff00-0000-1000-8000-00805f9b34fb";
    readonly writeUUID: "0000ff02-0000-1000-8000-00805f9b34fb";
    readonly notifyUUID: "0000ff01-0000-1000-8000-00805f9b34fb";
    readonly namePrefix: "DP";
    readonly mtu: 512;
    readonly packetDelay: 10;
    readonly debug: false;
    readonly paperWidth: 56;
};
export declare const OPTIONAL_SERVICES: string[];
