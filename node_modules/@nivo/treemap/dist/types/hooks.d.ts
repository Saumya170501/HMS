import { HierarchyNode } from 'd3-hierarchy';
import { PropertyAccessor } from '@nivo/core';
import { DefaultTreeMapDatum, TreeMapCommonProps, TreeMapDataProps, ComputedNode, ComputedNodeWithoutStyles, ComputedNodeWithHandlers, CustomLayerProps } from './types';
export declare const useTreeMapLayout: <Datum extends object>({ width, height, tile, innerPadding, outerPadding, enableParentLabel, parentLabelSize, parentLabelPosition, leavesOnly, }: {
    width: number;
    height: number;
    tile: "binary" | "dice" | "slice" | "sliceDice" | "squarify";
    innerPadding: number;
    outerPadding: number;
    enableParentLabel: boolean;
    parentLabelSize: number;
    parentLabelPosition: "top" | "right" | "bottom" | "left";
    leavesOnly: boolean;
}) => import("d3-hierarchy").TreemapLayout<Datum>;
export declare const useHierarchy: <Datum extends object>({ root, getValue, }: {
    root: Datum;
    getValue: (datum: Datum) => number;
}) => HierarchyNode<Datum>;
export declare const useTreeMap: <Datum extends object = DefaultTreeMapDatum>({ data, width, height, identity, value, valueFormat, leavesOnly, tile, innerPadding, outerPadding, label, orientLabel, enableParentLabel, parentLabel, parentLabelSize, parentLabelPosition, parentLabelPadding, colors, colorBy, nodeOpacity, borderColor, labelTextColor, parentLabelTextColor, }: {
    data: Datum;
    width: number;
    height: number;
    identity?: PropertyAccessor<Datum, string> | undefined;
    value?: PropertyAccessor<Datum, number> | undefined;
    valueFormat?: import("@nivo/core").ValueFormat<number, void> | undefined;
    tile?: "binary" | "dice" | "slice" | "sliceDice" | "squarify" | undefined;
    leavesOnly?: boolean | undefined;
    innerPadding?: number | undefined;
    outerPadding?: number | undefined;
    label?: PropertyAccessor<Omit<ComputedNodeWithoutStyles<Datum>, "label" | "parentLabel">, string> | undefined;
    orientLabel?: boolean | undefined;
    enableParentLabel?: boolean | undefined;
    parentLabel?: PropertyAccessor<Omit<ComputedNodeWithoutStyles<Datum>, "parentLabel">, string> | undefined;
    parentLabelSize?: number | undefined;
    parentLabelPosition?: "top" | "right" | "bottom" | "left" | undefined;
    parentLabelPadding?: number | undefined;
    colors?: import("@nivo/colors").OrdinalColorScaleConfig<ComputedNodeWithoutStyles<Datum>> | undefined;
    colorBy?: string | import("@nivo/colors").DatumIdentityAccessor<ComputedNodeWithoutStyles<Datum>> | undefined;
    nodeOpacity?: number | undefined;
    borderColor?: import("@nivo/colors").InheritedColorConfig<ComputedNodeWithoutStyles<Datum> & {
        color: string;
    }> | undefined;
    labelTextColor?: import("@nivo/colors").InheritedColorConfig<ComputedNodeWithoutStyles<Datum> & {
        color: string;
    }> | undefined;
    parentLabelTextColor?: import("@nivo/colors").InheritedColorConfig<ComputedNodeWithoutStyles<Datum> & {
        color: string;
    }> | undefined;
}) => {
    hierarchy: HierarchyNode<Datum>;
    nodes: ComputedNode<Datum>[];
    layout: import("d3-hierarchy").TreemapLayout<Datum>;
};
export declare const useInteractiveTreeMapNodes: <Datum extends object>(nodes: ComputedNode<Datum>[], { isInteractive, onMouseEnter, onMouseMove, onMouseLeave, onClick, tooltip, }: {
    isInteractive: boolean;
    onMouseEnter?: import("./types").NodeMouseEventHandler<Datum> | undefined;
    onMouseMove?: import("./types").NodeMouseEventHandler<Datum> | undefined;
    onMouseLeave?: import("./types").NodeMouseEventHandler<Datum> | undefined;
    onClick?: import("./types").NodeMouseEventHandler<Datum> | undefined;
    tooltip: import("./types").TooltipComponent<Datum>;
}) => ComputedNodeWithHandlers<Datum>[];
export declare const useCustomLayerProps: <Datum extends object>({ nodes, }: CustomLayerProps<Datum>) => CustomLayerProps<Datum>;
//# sourceMappingURL=hooks.d.ts.map