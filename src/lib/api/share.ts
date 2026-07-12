import { api } from "@/lib/api";
import { ApiResponse, FlowDocumentData, SharedFlowDocumentResponseData, ShareFlowRequest, ShareFlowResponseData } from "@/lib/interfaces";


export function shareFlow(document: FlowDocumentData): Promise<ApiResponse<ShareFlowResponseData>> {
   const requestBody: ShareFlowRequest = { document };

   return api.post<ShareFlowResponseData>("/share",requestBody);
}

export function getSharedFlow(flowId: string): Promise<ApiResponse<SharedFlowDocumentResponseData>> {
   return api.get<SharedFlowDocumentResponseData>(`/share/${flowId}`);
}