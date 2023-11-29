from flask import Flask, redirect, url_for, render_template, request, session, jsonify, request
from flask_oauthlib.client import OAuth
from flask_cors import CORS
import os
from azure.storage.blob import BlobServiceClient

# Flask App Initialization
app = Flask(__name__)
app.secret_key = 'My_Secret_Key'  # Replace with your actual secret key
CORS(app)


# OAuth Setup
oauth = OAuth(app)
azure = oauth.remote_app(
    'azure',
    consumer_key='0c9d2e09-08a6-4bfe-98f2-85bb2040e8b2',  # Replace with your Azure AD Application ID
    consumer_secret='3248Q~4ei0YVj7PEu0mElx0Qpb_nGkPv3UiXJa3t',  # Replace with your Azure AD Client Secret
    request_token_params={'scope': 'openid email profile'},
    base_url='https://graph.microsoft.com/v1.0/',
    request_token_url=None,
    access_token_method='POST',
    access_token_url='https://login.microsoftonline.com/bd717aa1-6670-4ce3-ba94-ef01de50c477/oauth2/v2.0/token',  # Replace TENANT_ID
    authorize_url='https://login.microsoftonline.com/bd717aa1-6670-4ce3-ba94-ef01de50c477/oauth2/v2.0/authorize'  # Replace TENANT_ID
)


# Azure Blob Storage Setup
storage_account_name = os.getenv('AZURE_STORAGE_ACCOUNT_NAME', 'podcastscoref')
storage_account_key = os.getenv('AZURE_STORAGE_ACCOUNT_KEY', 'mYdJ0JI2YBZKj56B1u33/xYwsN3LbpyM6jYum+PxClFSlPs2kqsHZFP+5R8RFE9yfOGBSk4E93mr+AStqo/S9w==')

# Create the BlobServiceClient object
blob_service_client = BlobServiceClient(account_url=f"https://{storage_account_name}.blob.core.windows.net", credential=storage_account_key)


# Azure Blob Storage Routes
@app.route('/list-files')
def list_files():
    container_name = "podcasts-coref"
    try:
        container_client = blob_service_client.get_container_client(container_name)
        blob_list = container_client.list_blobs()
        files = [blob.name for blob in blob_list]
        links = {file: url_for('read_file', filename=file) for file in files}
        return render_template('list_files.html', links=links)  # Render a template with the file links
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/read-file/<filename>')
def read_file(filename):
    container_name = "podcasts-coref"
    try:
        blob_client = blob_service_client.get_blob_client(container=container_name, blob=filename)
        download_stream = blob_client.download_blob()
        file_content = download_stream.readall()
        return render_template('read_file.html', file_content=file_content)  # Render a template with the file content
    except Exception as e:
        return jsonify({"error": str(e)})


@app.route('/write-file/<filename>', methods=['POST'])
def write_file(filename):
    container_name = "podcasts-coref"
    file_content = request.data  # Get file content from the request
    try:
        blob_client = blob_service_client.get_blob_client(container=container_name, blob=filename)
        blob_client.upload_blob(file_content, overwrite=True)
        return {"status": "File uploaded successfully."}
    except Exception as e:
        return {"error": str(e)}

@app.route('/')
def index():
    anonymous = request.args.get('anonymous', '0')
    print("Anonymous:", anonymous)  # This will print in your Flask server console
    return render_template('index.html', anonymous=anonymous)


@app.route('/login')
def login():
    return azure.authorize(callback=url_for('authorized', _external=True))

@app.route('/?anonymous=1')
def anonymous():
    return render_template('index.html/?anonymous=1', anonymous=True)

@app.route('/login/authorized')
def authorized():
    response = azure.authorized_response()
    if response is None or response.get('access_token') is None:
        return 'Access Denied: Reason=%s\nError=%s' % (
            request.args['error_reason'],
            request.args['error_description']
        )
    session['azure_token'] = (response['access_token'], '')
    return redirect(url_for('list_files'))
 
@azure.tokengetter
def get_azure_oauth_token():
    return session.get('azure_token')

# Main Entry Point
if __name__ == '__main__':
    app.run(debug=True)
