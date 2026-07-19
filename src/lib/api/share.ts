import { api } from '@/lib/api';
import { ApiResponse, SharedFlowDocumentResponseData, ShareFlowDocumentRequest, ShareFlowResponseData } from '@/lib/interfaces';


export function shareFlow(payload: ShareFlowDocumentRequest): Promise<ApiResponse<ShareFlowResponseData>> {
   return api.post<ShareFlowResponseData>('/share', payload);
}

export function getSharedFlow(flowId: string): Promise<ApiResponse<SharedFlowDocumentResponseData>> {
   return api.get<SharedFlowDocumentResponseData>(`/share/${flowId}`);
}