import pandas as pd
from sklearn import preprocessing
from sklearn.manifold import MDS
import pandas
from flask import Flask
from flask import render_template
from sklearn.cluster import KMeans
import numpy as np
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA
from sklearn.metrics import pairwise_distances
from sklearn.preprocessing import MinMaxScaler
from scipy.spatial.distance import cdist
from kneed import KneeLocator
import random

app = Flask(__name__)

scaler = MinMaxScaler()
df = pd.read_csv("loandata.csv")
df.dropna(inplace=True)
df.fillna(0)
colname_list = list(df.columns.values)
df_eval = df.iloc[: , 1:] #remove cust id
df_eval = df_eval.fillna(df_eval.median())
df_eval = pd.DataFrame(scaler.fit_transform(df_eval))

@app.route("/")
def d3():
    return render_template('index.html')

# RANDOM SAMPLING

def random_sample(arr, size):
    random_data = []
    val= random.sample(list(range(0,arr.shape[0])),size)
    for i in val:
        random_data.append(arr[i])
    return (np.array(random_data))


random_data = random_sample(df_eval.values, 375)
data_total = random_sample(df_eval.values, df_eval.values.shape[0]) #entire dataset
data_total_part = random_sample(df_eval.values, 1000)

#K MEANS ELBOW 

def kmeans_clustering():
    distortions = []
    Error=[]
    
    X = df_eval.values
    normalized_data = preprocessing.normalize(X, norm='l2')
    
    for k in range(1, 20):
        model = KMeans(n_clusters=k).fit(normalized_data)
        model.fit(normalized_data)
        Error.append(model.inertia_)

    plt.plot(range(1, 20), Error, 'bx-')
    plt.xlabel('k')
    plt.ylabel('Inertia')
    plt.title('optimal k using elbow method')
    # plt.show()
    kn = KneeLocator(range(1, 20),Error , curve='convex', direction='decreasing')
    print("kn.knee",kn.knee)
    return kn.knee
    
    
def decimation(optimalk, X):

    X1 = preprocessing.normalize(X, norm='l2')
    kmeans = KMeans(n_clusters=optimalk, init='k-means++', max_iter=300, n_init=10, random_state=0)
    y_kmeans = kmeans.fit_predict(X1)
    df_cluster = pd.DataFrame(X, columns=colname_list[1:])
    df_cluster['clusterid'] = y_kmeans
    return df_cluster

optimal_knee= kmeans_clustering()
clustered_df = decimation(optimal_knee, df_eval.values)
arr_cluster = range(min(clustered_df['clusterid'].values), max(clustered_df['clusterid'].values) + 1)

# STRATIFIED SAMPLING

def stratified_sampling(clustered_df, size):

    res = []
    stratified_data = dict()

    for i in range(len(arr_cluster)):
        inp_arr = clustered_df.loc[clustered_df['clusterid'] == i].values[:, 0:-1]
        stratified_data[i] = random_sample(inp_arr, (size // len(arr_cluster)))

    for i in stratified_data.values():
        res.append(i)

    return np.concatenate(tuple(res), axis=0)


stratified_data = stratified_sampling(decimation(optimal_knee, df_eval.values), 375)



#SCREE PLOT 
# BEFORE SAMPLING

@app.route('/pca_scree')
def scree_plot():
    return pd.io.json.dumps(PCA().fit(data_total).explained_variance_ratio_)

@app.route('/scree_random')
def scree_plot_random():
    return pd.io.json.dumps(PCA().fit(random_data).explained_variance_ratio_)


@app.route('/scree_strat')
def scree_plot_stratified():
    return pd.io.json.dumps(PCA().fit(stratified_data).explained_variance_ratio_)


# TOP 3 ATTRIBUTES
def intrinsic_dimension(data, n_components):

   
    eigen_values = PCA().fit(data).explained_variance_ratio_

    eigen_vectors = PCA().fit(data).components_
    loadings_list = []
  
    for x in range(eigen_values.shape[0]):
        loadings = 0

        for y in range(0, n_components):
            loadings += eigen_vectors[y, x] ** 2
        loadings_list.append(loadings)
    return loadings_list

randlist = intrinsic_dimension(random_data, 3)

randftr = sorted(range(len(randlist)), key=lambda k: randlist[k], reverse=True)


stratlist = intrinsic_dimension(stratified_data, 4)

stratftr = sorted(range(len(stratlist)), key=lambda k: stratlist[k], reverse=True)


orglist = intrinsic_dimension(data_total,4)

orgftr = sorted(range(len(orglist)), key=lambda k: orglist[k], reverse=True)



#task 3 - 1
# data projected into the top two PCA vectors via 2D scatterplot


@app.route('/pca_original')
def pca_original():

    pca = PCA(n_components=2)
    pca.fit(data_total)
    transformed_Xval = pca.transform(data_total)
    decdata = decimation(optimal_knee, data_total)

    output_data = pd.DataFrame(transformed_Xval)
    output_data['clusterid'] = decdata['clusterid']
    return pd.io.json.dumps(output_data)


@app.route('/pca_random')
def pca_random():

    pca = PCA(n_components=2)
    pca.fit(random_data)
    transformed_Xval = pca.transform(random_data)
    decdata = decimation(optimal_knee, random_data)

    output_data = pd.DataFrame(transformed_Xval)
    output_data['clusterid'] = decdata['clusterid']
    return pd.io.json.dumps(output_data)


# PROJECTION ON TOP 3 COMPONENTS OF STRATIFIED DATA

@app.route('/pca_strat')
def pca_stratified():

    pca = PCA(n_components=2)
    pca.fit(stratified_data)
    transformed_Xval = pca.transform(stratified_data)
    decdata = decimation(optimal_knee, stratified_data)

    output_data = pd.DataFrame(transformed_Xval)
    output_data['clusterid'] = decdata['clusterid']
    return pd.io.json.dumps(output_data)

#Task 3 -2 
# data via MDS (Euclidian & correlation distance) in 2D scatterplots

@app.route('/euc_org')
def euc_org():
    mds = MDS(n_components=2, dissimilarity='precomputed') 
    X = mds.fit_transform(pairwise_distances(data_total_part))
    dec_data = decimation(optimal_knee, data_total_part)
    output_data = pd.DataFrame(X)
    output_data['clusterid'] = dec_data['clusterid']

    return pandas.io.json.dumps(output_data)


@app.route('/euc_rand')
def euc_rand():
    mds = MDS(n_components=2, dissimilarity='precomputed')
    X = mds.fit_transform(pairwise_distances(random_data))
    dec_data = decimation(optimal_knee, random_data)
    output_data = pd.DataFrame(X)
    output_data['clusterid'] = dec_data['clusterid']

    return pandas.io.json.dumps(output_data)


@app.route('/euc_strat')
def euc_stratified():

    mds = MDS(n_components=2, dissimilarity='precomputed')
    X = mds.fit_transform(pairwise_distances(stratified_data))
    dec_data = decimation(optimal_knee, stratified_data)
    output_data = pd.DataFrame(X)
    output_data['clusterid'] = dec_data['clusterid']

    return pandas.io.json.dumps(output_data)



@app.route('/correlate_org')
def correlate_org():

    mds = MDS(n_components=2, dissimilarity='precomputed')
    data1 = mds.fit_transform(pairwise_distances(data_total_part, metric='correlation'))
    decdata = decimation(optimal_knee, data_total_part)
    output_data = pd.DataFrame(data1)
    output_data['clusterid'] = decdata['clusterid']
    return pandas.io.json.dumps(output_data)

@app.route('/correlate_rand')
def correlate_rand():

    mds = MDS(n_components=2, dissimilarity='precomputed')
    data1 = mds.fit_transform(pairwise_distances(random_data, metric='correlation'))
    decdata = decimation(optimal_knee, random_data)
    output_data = pd.DataFrame(data1)
    output_data['clusterid'] = decdata['clusterid']
    return pandas.io.json.dumps(output_data)



@app.route('/correlate_strat')
def correlate_stratified():

    mds = MDS(n_components=2, dissimilarity='precomputed')
  
    data1 = mds.fit_transform(pairwise_distances(stratified_data, metric='correlation'))
    decdata = decimation(optimal_knee, stratified_data)
    output_data = pd.DataFrame(data1)
    output_data['clusterid'] = decdata['clusterid']

    return pandas.io.json.dumps(output_data)

# Task 3 -3
#three highest PCA loaded attributes


@app.route('/threehigh_org')
def threehigh_org():

    dec_data = decimation(optimal_knee, data_total_part)
    totarr= np.column_stack((data_total_part[:,randftr[0]],data_total_part[:,randftr[1]],data_total_part[:,randftr[2]]))
    output_data = pd.DataFrame(totarr)
    output_data['clusterid'] = dec_data['clusterid']

    return pandas.io.json.dumps(output_data)


@app.route('/threehigh_random')
def threehigh_random():

    dec_data = decimation(optimal_knee, random_data)
    totarr= np.column_stack((random_data[:,randftr[0]],random_data[:,randftr[1]],random_data[:,randftr[2]]))
    output_data = pd.DataFrame(totarr)
    output_data['clusterid'] = dec_data['clusterid']

    return pandas.io.json.dumps(output_data)


@app.route('/threehigh_strat')
def threehigh_stratified():

    dec_data = decimation(optimal_knee, stratified_data)
    totarr= np.column_stack((stratified_data[:,randftr[0]],stratified_data[:,randftr[1]],stratified_data[:,randftr[2]]))
    output_data = pd.DataFrame(totarr)
    output_data['clusterid'] = dec_data['clusterid']

    return pandas.io.json.dumps(output_data)


if __name__ == "__main__":
    app.run("localhost", 7658, debug=True)
