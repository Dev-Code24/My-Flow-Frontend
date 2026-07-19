"use client";

import { useState } from "react";

import { shareFlow } from "@/lib/api/share";
import { FlowDocumentData } from "@/lib/interfaces";
import { toast } from "@/ui/toast/toast.service";

interface UseExportFlowResult {
   exportFlow: (document: FlowDocumentData) => Promise<string | null>;
   isExporting: boolean;
}

export function useExportFlow(): UseExportFlowResult {
   const [isExporting, setIsExporting] = useState<boolean>(false);

   async function exportFlow(
      document: FlowDocumentData
   ): Promise<string | null> {
      if (isExporting) {
         return null;
      }

      setIsExporting(true);

      try {
         const payload = {
            document: {
              schemaVersion: 1,
              canvas: {
                elements: document.elements,
              },
            },
          };
          
         const response = await shareFlow(payload);
         const { flowId } = response.data;
         const shareableUrl = `${window.location.origin}/share/${flowId}`;

         await navigator.clipboard.writeText(shareableUrl);
         toast.success("Shareable link copied to clipboard.");

         return shareableUrl;
      } catch (error) {
         console.error("Failed to export whiteboard:", error);

         toast.error("We couldn't create the shareable link. Please try again.");

         return null;
      } finally {
         setIsExporting(false);
      }
   }

   return {
      exportFlow,
      isExporting,
   };
}