import sqlite3
import pandas as pd
import numpy as np
from scipy.spatial import distance
import seaborn as sns
import matplotlib.pyplot as plt

def analyze_emotion_clusters(db_path, output_path=None):
    """
    Analyze emotion clusters in VAD space using Mahalanobis Distance.
    
    Args:
        db_path: Path to SQLite database
        output_path: Optional path to save visualization
        
    Returns:
        DataFrame with emotion cluster metrics
    """
    # Load data from database
    conn = sqlite3.connect(db_path)
    df = pd.read_sql_query(
        "SELECT v, a, d, emotion FROM matrix WHERE emotion IS NOT NULL",
        conn
    )
    conn.close()
    
    # Calculate Mahalanobis metrics for each emotion
    results = []
    
    for emotion in df['emotion'].unique():
        emotion_data = df[df['emotion'] == emotion]
        
        # Skip emotions with too few samples
        if len(emotion_data) < 4:
            continue
            
        # Extract VAD coordinates
        vad_points = emotion_data[['v', 'a', 'd']].values
        centroid = np.mean(vad_points, axis=0)
        
        try:
            # Calculate covariance and its inverse
            cov_matrix = np.cov(vad_points, rowvar=False)
            
            # Add small regularization to prevent singular matrices
            cov_matrix += np.eye(3) * 1e-6
            inv_cov = np.linalg.inv(cov_matrix)
            
            # Calculate Mahalanobis distance for each point
            mahalanobis_distances = [
                distance.mahalanobis(point, centroid, inv_cov) 
                for point in vad_points
            ]
            
            # Store results
            results.append({
                'emotion': emotion,
                'count': len(emotion_data),
                'min_mahalanobis': np.min(mahalanobis_distances),
                'median_mahalanobis': np.median(mahalanobis_distances),
                'mean_mahalanobis': np.mean(mahalanobis_distances),
                'max_mahalanobis': np.max(mahalanobis_distances),
                'std_mahalanobis': np.std(mahalanobis_distances)
            })
            
        except np.linalg.LinAlgError:
            # Skip emotions with problematic covariance matrices
            pass
    
    # Create DataFrame and sort by mean distance
    results_df = pd.DataFrame(results).sort_values('mean_mahalanobis')
    
    # Create visualization
    plt.figure(figsize=(12, 10))
    
    # Create horizontal bar plot with error bars
    ax = sns.barplot(
        y='emotion', 
        x='mean_mahalanobis', 
        data=results_df, 
        palette='viridis_r'
    )
    
    # Add error bars
    plt.errorbar(
        x=results_df['mean_mahalanobis'], 
        y=range(len(results_df)),
        xerr=results_df['std_mahalanobis'],
        fmt='none', 
        capsize=3, 
        ecolor='black', 
        alpha=0.5
    )
    
    # Clean styling
    plt.title('Emotion Cluster Compactness (Mahalanobis Distance)', fontsize=14)
    plt.xlabel('Mean Mahalanobis Distance (lower = tighter clusters)', fontsize=12)
    plt.ylabel('Emotion', fontsize=12)
    plt.grid(axis='x', linestyle='--', alpha=0.3)
    
    plt.tight_layout()
    
    # Save or display plot
    if output_path:
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
    else:
        plt.show()
        
    return results_df

# Example usage
if __name__ == "__main__":
    # Replace with your database path
    results = analyze_emotion_clusters("sonnet-37-normal.sqlite", "sonnet-37-normal.png")
    
    # Calculate overall statistics
    print("\n=== OVERALL MAHALANOBIS DISTANCE STATISTICS ===")
    print(f"Overall mean:    {results['mean_mahalanobis'].mean():.2f}")
    print(f"Overall min:     {results['min_mahalanobis'].min():.2f}")
    print(f"Overall max:     {results['max_mahalanobis'].max():.2f}")
    print(f"Overall median:  {results['median_mahalanobis'].median():.2f}")
    
    # Show best and worst emotions
    print("\n=== EMOTION CLUSTER QUALITY ===")
    print(f"Most compact emotion:  {results.iloc[0]['emotion']} (mean: {results.iloc[0]['mean_mahalanobis']:.2f})")
    print(f"Least compact emotion: {results.iloc[-1]['emotion']} (mean: {results.iloc[-1]['mean_mahalanobis']:.2f})")
