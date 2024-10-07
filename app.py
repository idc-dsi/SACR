from flask import Flask, redirect, url_for, render_template, request, session, jsonify, Response
from flask_oauthlib.client import OAuth
from flask_cors import CORS
from flask_compress import Compress
import os
import json
from azure.storage.blob import BlobServiceClient, BlobClient, ContentSettings
from urllib.parse import unquote
from werkzeug.middleware.proxy_fix import ProxyFix
import requests
import jwt
from dotenv import load_dotenv

# Load environment variables from .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)


# Flask App Initialization
app = Flask(__name__)
Compress(app)
app.secret_key = os.getenv('FLASK_SECRET_KEY')
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1)
CORS(app)


# OAuth Setup
oauth = OAuth(app)
azure = oauth.remote_app(
    'azure',
    consumer_key=os.getenv('AZURE_CLIENT_ID', 'your_client_id'),  # Replace with your Azure AD Application ID
    consumer_secret=os.getenv('AZURE_CLIENT_SECRET', 'your_client_secret'),  # Replace with your Azure AD Client Secret
    request_token_params={'scope': 'openid email profile'},
    base_url='https://graph.microsoft.com/v1.0/',
    request_token_url=None,
    access_token_method='POST',
    access_token_url=f"https://login.microsoftonline.com/{os.getenv('AZURE_TENANT_ID', 'your_tenant_id')}/oauth2/v2.0/token",  # Replace TENANT_ID
    authorize_url=f"https://login.microsoftonline.com/{os.getenv('AZURE_TENANT_ID', 'your_tenant_id')}/oauth2/v2.0/authorize"  # Replace TENANT_ID
)


# Azure Blob Storage Setup
storage_account_name = os.getenv('AZURE_STORAGE_ACCOUNT_NAME', 'your_storage_account_name')
storage_account_key = os.getenv('AZURE_STORAGE_ACCOUNT_KEY', 'your_storage_account_key')

# Create the BlobServiceClient object
blob_service_client = BlobServiceClient(account_url=f"https://{storage_account_name}.blob.core.windows.net", credential=storage_account_key)



# Azure Blob Storage Routes
@app.route('/list-files')
def list_files():
    container_name = "podcasts-coref"
    user_name = session.get('username')  # Retrieve the username from the session
    list_of_users = ['amir.ejmail','alex.barell','khalil.nashef','omri.magen','shani.aviv','tal.cohen','yasmeen.karram']
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

        # Return content as plain text
        return Response(file_content, mimetype='text/plain')
    except Exception as e:
        return jsonify({"error": str(e)}), 404


@app.route('/save-file/<path:filename>', methods=['POST'])
def save_file(filename):
    container_name = "podcasts-coref"
    try:
        decoded_filename = unquote(filename)
        content = request.get_data(as_text=True)  # Get data as text
        
        # Remove Zero Width Space characters(formatting overhead)
        content = content.replace(u"\u200B", "")
        
        # Remove non-breaking space characters
        content = content.replace(u"\u00A0", " ")
        
        blob_client = BlobClient(account_url=f"https://{storage_account_name}.blob.core.windows.net",
                                 container_name=container_name, 
                                 blob_name=decoded_filename, 
                                 credential=storage_account_key)

        # Upload the content as plain text
        blob_client.upload_blob(content, overwrite=True, content_settings=ContentSettings(content_type='text/plain'))

        return jsonify({"message": "File saved successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/')
def index():
    anonymous = request.args.get('anonymous', 0)
    logged_in = session.get('logged_in', False)
    return render_template('index.html', anonymous=anonymous,logged_in=logged_in)

@app.route('/login')
def login():
    callback_url = url_for('authorized', _external=True, _scheme='https')
    return azure.authorize(callback=callback_url)
    #Localhost
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