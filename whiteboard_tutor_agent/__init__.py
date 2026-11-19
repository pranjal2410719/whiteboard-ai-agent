"""
Whiteboard Tutor AI Agent
==========================
An autonomous AI Tutor Agent for live interactive visual teaching on Excalidraw whiteboards.
Controls the canvas, narrates concepts, draws diagrams, evaluates student responses,
and manages the complete pedagogical loop.
"""

__version__ = "1.0.0"

from .canvas_client import CanvasClient
from .curriculum import Curriculum, LessonStep, LessonTopic
from .flowchart_manager import Flowchart, FlowchartEdgeDef, FlowchartManager, FlowchartNodeDef
from .llm_client import LLMClient
from .semantic_element import InnerTextBounds, SemanticElement
from .spatial_context import BoundingBox, SpatialContext
from .tutor_agent import WhiteboardTutorAgent
from .whiteboard_ops import WhiteboardOperations

__all__ = [
    "BoundingBox",
    "CanvasClient",
    "Curriculum",
    "Flowchart",
    "FlowchartEdgeDef",
    "FlowchartManager",
    "FlowchartNodeDef",
    "InnerTextBounds",
    "LessonStep",
    "LessonTopic",
    "LLMClient",
    "SemanticElement",
    "SpatialContext",
    "WhiteboardOperations",
    "WhiteboardTutorAgent",
]
