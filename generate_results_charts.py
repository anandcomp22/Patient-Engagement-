import matplotlib.pyplot as plt
import numpy as np
import os

# Ensure the script generates the images in the same directory
output_dir = os.path.dirname(os.path.abspath(__file__))

def generate_diagnostic_bar_chart():
    labels = ['Accuracy', 'Precision', 'Recall']
    ocular = [94.2, 93.8, 94.0]
    pneumonia = [96.8, 96.5, 97.1]

    x = np.arange(len(labels))
    width = 0.35

    # Medical professional color palette
    color1 = '#2c5282' # Dark Blue
    color2 = '#4299e1' # Light Blue

    fig, ax = plt.subplots(figsize=(8, 5))
    rects1 = ax.bar(x - width/2, ocular, width, label='Ocular Disease', color=color1)
    rects2 = ax.bar(x + width/2, pneumonia, width, label='Pneumonia', color=color2)

    ax.set_ylabel('Percentage (%)', fontsize=12, fontweight='bold')
    ax.set_title('Diagnostic Model Performance Metrics', fontsize=14, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=11)
    ax.set_ylim(80, 100) # Zoom in for clarity
    
    # Place Legend outside
    ax.legend(loc='lower right')

    # Add text labels on top of bars
    for p in ax.patches:
        ax.annotate(f"{p.get_height()}%", 
                    (p.get_x() + p.get_width() / 2., p.get_height()), 
                    ha='center', va='bottom', fontsize=10, fontweight='bold')

    plt.tight_layout()
    output_path = os.path.join(output_dir, 'diagnostic_performance.png')
    plt.savefig(output_path, dpi=300)
    print(f"Saved: {output_path}")

def generate_system_metrics_chart():
    # Horizontal bar chart for other metrics
    metrics = ['Transcription\nAccuracy', 'RAG Contextual\nSimilarity', 'User\nSatisfaction']
    values = [93, 91, 92]
    
    fig, ax = plt.subplots(figsize=(8, 4))
    
    # Custom colors
    colors = ['#38a169', '#319795', '#d69e2e']
    
    bars = ax.barh(metrics, values, color=colors)
    
    ax.set_xlabel('Percentage (%)', fontsize=12, fontweight='bold')
    ax.set_title('System Usability and AI Pipeline Accuracy', fontsize=14, fontweight='bold')
    ax.set_xlim(0, 100)
    
    # Annotate bars
    for bar in bars:
        ax.text(bar.get_width() - 8, bar.get_y() + bar.get_height()/2, 
                f'{bar.get_width()}%', 
                va='center', ha='center', color='white', fontweight='bold', fontsize=12)
        
    plt.tight_layout()
    output_path = os.path.join(output_dir, 'system_metrics.png')
    plt.savefig(output_path, dpi=300)
    print(f"Saved: {output_path}")

if __name__ == '__main__':
    try:
        generate_diagnostic_bar_chart()
        generate_system_metrics_chart()
        print("Success! You can now use these PNG files in your Overleaf document.")
    except ImportError:
        print("Error: Please install matplotlib and numpy first by running: pip install matplotlib numpy")
