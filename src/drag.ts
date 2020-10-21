let dragConfig: {
  startPosition: number; 
  dragHandler: (delta: number, otherInfo: any) => void;
  endHandler?: (delta: number, otherInfo: any) => void;
  otherInfo: any;
} | null = null;

export function dragStart<T>(
  {button, onDrag, otherInfoGetter, onEnd}: {
    button: "LEFT" | "RIGHT";
    onDrag: (delta: number, otherInfo: T) => void;
    otherInfoGetter: () => T;
    onEnd?: (delta: number, otherInfo: T) => void;
  }): (event: MouseEvent) => void {
  const requiredButtonNumber = {
    "LEFT": 0,
    "RIGHT": 2
  }[button || "LEFT"];

  return (event: MouseEvent) => {
    if (event.button === requiredButtonNumber) {
      dragConfig = {
        startPosition: event.screenX,
        dragHandler: onDrag,
        endHandler: onEnd,
        otherInfo: otherInfoGetter(),
      };
    }
  }
}

export function dragEnd(event: MouseEvent) {
  if (dragConfig && dragConfig.endHandler) {
    dragConfig.endHandler(event.screenX - dragConfig.startPosition, dragConfig.otherInfo);
  }
  dragConfig = null;
}

export function drag(event: MouseEvent) {
  if (dragConfig) {
    dragConfig.dragHandler(event.screenX - dragConfig.startPosition, dragConfig.otherInfo);
  }
}