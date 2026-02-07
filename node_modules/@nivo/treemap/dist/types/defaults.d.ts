/// <reference types="react" />
import { TreeMapCommonProps, DefaultTreeMapDatum, LayerId } from './types';
export declare const commonDefaultProps: Omit<TreeMapCommonProps<DefaultTreeMapDatum>, 'valueFormat' | 'margin' | 'theme' | 'labelFormat' | 'onMouseEnter' | 'onMouseMove' | 'onMouseLeave' | 'onClick' | 'renderWrapper' | 'ariaLabel' | 'ariaLabelledBy' | 'ariaDescribedBy'> & {
    layers: LayerId[];
};
export declare const svgDefaultProps: {
    nodeComponent: <Datum extends object>({ node, animatedProps, borderWidth, enableLabel, enableParentLabel, labelSkipSize, }: import("./types").NodeProps<Datum>) => JSX.Element;
    defs: never[];
    fill: never[];
    borderColor: import("@nivo/colors").InheritedColorConfig<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum> & {
        color: string;
    }>;
    labelTextColor: import("@nivo/colors").InheritedColorConfig<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum> & {
        color: string;
    }>;
    parentLabelTextColor: import("@nivo/colors").InheritedColorConfig<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum> & {
        color: string;
    }>;
    value: import("@nivo/core").PropertyAccessor<DefaultTreeMapDatum, number>;
    label: import("@nivo/core").PropertyAccessor<Omit<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum>, "label" | "parentLabel">, string>;
    parentLabel: import("@nivo/core").PropertyAccessor<Omit<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum>, "parentLabel">, string>;
    borderWidth: number;
    animate?: boolean | undefined;
    motionConfig?: string | Partial<import("@react-spring/core").AnimationConfig> | undefined;
    enableLabel: boolean;
    labelSkipSize: number;
    enableParentLabel: boolean;
    parentLabelSize: number;
    parentLabelPosition: "top" | "right" | "bottom" | "left";
    parentLabelPadding: number;
    identity: import("@nivo/core").PropertyAccessor<DefaultTreeMapDatum, string>;
    tile: "binary" | "dice" | "slice" | "sliceDice" | "squarify";
    leavesOnly: boolean;
    innerPadding: number;
    outerPadding: number;
    orientLabel: boolean;
    colors: import("@nivo/colors").OrdinalColorScaleConfig<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum>>;
    colorBy: string | import("@nivo/colors").DatumIdentityAccessor<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum>>;
    nodeOpacity: number;
    isInteractive: boolean;
    tooltip: import("./types").TooltipComponent<DefaultTreeMapDatum>;
    role: string;
    layers: LayerId[];
};
export declare const htmlDefaultProps: {
    nodeComponent: <Datum extends object>({ node, animatedProps, borderWidth, enableLabel, enableParentLabel, labelSkipSize, }: import("./types").NodeProps<Datum>) => JSX.Element;
    borderColor: import("@nivo/colors").InheritedColorConfig<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum> & {
        color: string;
    }>;
    labelTextColor: import("@nivo/colors").InheritedColorConfig<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum> & {
        color: string;
    }>;
    parentLabelTextColor: import("@nivo/colors").InheritedColorConfig<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum> & {
        color: string;
    }>;
    value: import("@nivo/core").PropertyAccessor<DefaultTreeMapDatum, number>;
    label: import("@nivo/core").PropertyAccessor<Omit<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum>, "label" | "parentLabel">, string>;
    parentLabel: import("@nivo/core").PropertyAccessor<Omit<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum>, "parentLabel">, string>;
    borderWidth: number;
    animate?: boolean | undefined;
    motionConfig?: string | Partial<import("@react-spring/core").AnimationConfig> | undefined;
    enableLabel: boolean;
    labelSkipSize: number;
    enableParentLabel: boolean;
    parentLabelSize: number;
    parentLabelPosition: "top" | "right" | "bottom" | "left";
    parentLabelPadding: number;
    identity: import("@nivo/core").PropertyAccessor<DefaultTreeMapDatum, string>;
    tile: "binary" | "dice" | "slice" | "sliceDice" | "squarify";
    leavesOnly: boolean;
    innerPadding: number;
    outerPadding: number;
    orientLabel: boolean;
    colors: import("@nivo/colors").OrdinalColorScaleConfig<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum>>;
    colorBy: string | import("@nivo/colors").DatumIdentityAccessor<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum>>;
    nodeOpacity: number;
    isInteractive: boolean;
    tooltip: import("./types").TooltipComponent<DefaultTreeMapDatum>;
    role: string;
    layers: LayerId[];
};
export declare const canvasDefaultProps: {
    pixelRatio: number;
    borderColor: import("@nivo/colors").InheritedColorConfig<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum> & {
        color: string;
    }>;
    labelTextColor: import("@nivo/colors").InheritedColorConfig<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum> & {
        color: string;
    }>;
    parentLabelTextColor: import("@nivo/colors").InheritedColorConfig<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum> & {
        color: string;
    }>;
    value: import("@nivo/core").PropertyAccessor<DefaultTreeMapDatum, number>;
    label: import("@nivo/core").PropertyAccessor<Omit<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum>, "label" | "parentLabel">, string>;
    parentLabel: import("@nivo/core").PropertyAccessor<Omit<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum>, "parentLabel">, string>;
    borderWidth: number;
    animate?: boolean | undefined;
    motionConfig?: string | Partial<import("@react-spring/core").AnimationConfig> | undefined;
    enableLabel: boolean;
    labelSkipSize: number;
    enableParentLabel: boolean;
    parentLabelSize: number;
    parentLabelPosition: "top" | "right" | "bottom" | "left";
    parentLabelPadding: number;
    identity: import("@nivo/core").PropertyAccessor<DefaultTreeMapDatum, string>;
    tile: "binary" | "dice" | "slice" | "sliceDice" | "squarify";
    leavesOnly: boolean;
    innerPadding: number;
    outerPadding: number;
    orientLabel: boolean;
    colors: import("@nivo/colors").OrdinalColorScaleConfig<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum>>;
    colorBy: string | import("@nivo/colors").DatumIdentityAccessor<import("./types").ComputedNodeWithoutStyles<DefaultTreeMapDatum>>;
    nodeOpacity: number;
    isInteractive: boolean;
    tooltip: import("./types").TooltipComponent<DefaultTreeMapDatum>;
    role: string;
    layers: LayerId[];
};
//# sourceMappingURL=defaults.d.ts.map