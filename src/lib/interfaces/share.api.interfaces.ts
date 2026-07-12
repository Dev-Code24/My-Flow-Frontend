import { Element } from "@/interfaces";

export interface FlowDocumentData {
   elements: Element[];
   pan: {
     x: number;
     y: number;
   };
   zoom: number;
 }
 
 export interface ShareFlowRequest {
   document: FlowDocumentData;
 }
 
 export interface ShareFlowResponseData {
   flowId: string;
   expiresAt: string;
 }
 
 export interface SharedFlowDocumentResponseData {
   flowId: string;
   expiresAt: string;
   document: FlowDocumentData;
 }