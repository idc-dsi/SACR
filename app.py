from flask import Flask, redirect, url_for, render_template, request, session, jsonify, Response
from flask_oauthlib.client import OAuth
from flask_cors import CORS
from flask_compress import Compress
import os
import json
from azure.storage.blob import BlobServiceClient, BlobClient
from urllib.parse import unquote
from werkzeug.middleware.proxy_fix import ProxyFix
import requests
import jwt





# Flask App Initialization
app = Flask(__name__)
Compress(app)
app.secret_key = 'My_Secret_Key'  # Replace with your actual secret key
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1)
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
    user_name = session.get('username')  # Retrieve the username from the session
    list_of_users = ['amir.ejmail']
    if not user_name:
        return jsonify([])  # If the user is not logged in, return an empty list

    try:
        container_client = blob_service_client.get_container_client(container_name)
        # Update to fetch blobs from the user-specific folder
        if user_name in list_of_users:
            blob_list = container_client.list_blobs(name_starts_with=user_name + '/')
            files = [blob.name for blob in blob_list]
        else:
            blob_list = container_client.list_blobs()
            files = [blob.name for blob in blob_list]
            
        return jsonify(files)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
@app.route('/read-file/<path:filename>')
def read_file(filename):
    container_name = "podcasts-coref"
    try:
        # Decode the URL-encoded filename
        decoded_filename = unquote(filename)
        blob_client = BlobClient(account_url=f"https://{storage_account_name}.blob.core.windows.net", 
                                 container_name=container_name, 
                                 blob_name=decoded_filename, 
                                 credential=storage_account_key)
        download_stream = blob_client.download_blob()
        file_content = download_stream.readall().decode('utf-8')
        return jsonify({"content": file_content})
    except Exception as e:
        return jsonify({"error": str(e)}), 404


@app.route('/save-file/<path:filename>', methods=['POST'])
def save_file(filename):
    container_name = "podcasts-coref"
    try:
        # Decode the URL-encoded filename
        decoded_filename = unquote(filename)
        content = request.data.decode('utf-8') 
        content_bytes = content.encode('utf-8')
        # Logic to save content to the file
        # Assuming using Azure Blob Storage
        blob_client = BlobClient(account_url=f"https://{storage_account_name}.blob.core.windows.net", 
                                 container_name=container_name, 
                                 blob_name=decoded_filename, 
                                 credential=storage_account_key)
        blob_client.upload_blob(content_bytes, overwrite=True)

        return jsonify({"message": "File saved successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/getFileContent/<path:filename>')
def get_file_content(filename):
    # Logic to fetch and return file content
    # For example, reading from a file system or database
    try:
        # Assuming file is stored in a known directory
        with open(f'path_to_files/{filename}', 'r') as file:
            content = file.read()
        return jsonify({"content": content})
    except IOError:
        return jsonify({"error": "File not found"}), 404


@app.route('/')
def index():
    anonymous = request.args.get('anonymous', 0)
    logged_in = session.get('logged_in', False)
    return render_template('index.html', anonymous=anonymous,logged_in=logged_in)

@app.route('/login')
def login():
    callback_url = url_for('authorized', _external=True, _scheme='https')
    return azure.authorize(callback=callback_url)
    #return azure.authorize(url_for('authorized', _external=True))


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
    
    id_token = response.get('id_token')
    if id_token:
        # Decode the ID token
        decoded_token = jwt.decode(id_token, options={"verify_signature": False})

        # Extract the 'name'
        user_name = decoded_token.get('name')
        if user_name:
            session['username'] = user_name
            #print("User Name:", user_name)
        
    # Set a session variable to indicate the user is logged in
    #for azure 
    callback_url = url_for('index', logged_in=True, _scheme='https')
    return redirect(callback_url)
    
    #for local host
    #return redirect(url_for('index', logged_in=True))
 
@azure.tokengetter
def get_azure_oauth_token():
    return session.get('azure_token')

# Main Entry Point
if __name__ == '__main__':
    app.run(debug=True)