from setuptools import setup, find_packages

setup(
    name="whiteboard-ai-agent",
    version="1.0.0",
    description="Autonomous Whiteboard AI Agent with Spatial Context Tracking, Precision Annotations & Flowchart Intelligence",
    author="pranjal2410719",
    author_email="2k24.cs1l.2410719@gmail.com",
    packages=find_packages(),
    install_requires=[
        "requests>=2.28.0",
    ],
    entry_points={
        "console_scripts": [
            "whiteboard-tutor=whiteboard_tutor_agent.cli:main",
            "whiteboard-server=whiteboard_tutor_agent.server:main",
        ],
    },
    python_requires=">=3.10",
)
