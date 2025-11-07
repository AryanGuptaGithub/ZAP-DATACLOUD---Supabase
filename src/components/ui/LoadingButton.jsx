// LoadingButton.jsx
import React from "react";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";


export default function LoadingButton({ loading, children, disabled, ...props }) {
   
  return (
    <Button disabled={loading || disabled} {...props}>
      {loading && <Spinner className="h-4 w-4 mr-2" />}
      {children}
    </Button>
  );
}
