import React, { LazyExoticComponent, ComponentType } from "react";

// Helper function to wrap lazy-loaded components to work with wouter
export function withDelayedComponent<P>(
  LazyComponent: LazyExoticComponent<ComponentType<P>>
): () => JSX.Element {
  return (props: any) => <LazyComponent {...props} />;
} 